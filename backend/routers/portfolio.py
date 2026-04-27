from fastapi import APIRouter, HTTPException
import pandas as pd
import numpy as np
from scipy.optimize import minimize
from models.schemas import PortfolioRequest
from services.data_service import fetch_prices, get_returns, fetch_benchmark, get_last_skipped
from services.analytics_service import (
    compute_portfolio_analytics,
    run_monte_carlo,
    compute_var_metrics,
    compute_efficient_frontier,
    generate_insights,
    compute_portfolio_score
)

router = APIRouter(prefix="/api/portfolio", tags=["portfolio"])


def _deduplicate_tickers(tickers, weights):
    seen = {}
    for t, w in zip(tickers, weights):
        t_clean = t.strip().upper()
        if t_clean in seen:
            seen[t_clean] += w
        else:
            seen[t_clean] = w
    tickers_out = list(seen.keys())
    weights_out = list(seen.values())
    total = sum(weights_out)
    if total > 0:
        weights_out = [w / total for w in weights_out]
    return tickers_out, weights_out


def _get_min_variance_weights(returns):
    mean_returns = returns.mean() * 252
    cov_matrix   = returns.cov() * 252
    n = len(mean_returns)
    try:
        result = minimize(
            lambda w: float(np.dot(w, np.dot(cov_matrix, w))),
            x0=np.array([1/n] * n),
            method="SLSQP",
            bounds=tuple((0, 1) for _ in range(n)),
            constraints=[{"type": "eq", "fun": lambda w: np.sum(w) - 1}]
        )
        tickers = [t.replace(".NS", "") for t in returns.columns]
        if result.success:
            return {tickers[i]: round(float(result.x[i]) * 100, 2) for i in range(n)}
    except Exception:
        pass
    return {}


def _normalize_weights(weights, n):
    weights = list(weights[:n])
    total = sum(weights)
    if total > 0:
        return [w / total for w in weights]
    return [1/n] * n


def _get_scaling(n_stocks):
    if n_stocks > 50:
        return 500, 10
    elif n_stocks > 30:
        return 800, 15
    elif n_stocks > 20:
        return 1000, 20
    elif n_stocks > 15:
        return 1500, 25
    elif n_stocks > 10:
        return 2000, 30
    elif n_stocks > 5:
        return 3000, 40
    else:
        return 5000, 60


def _is_valid(val):
    try:
        return val == val and abs(val) != float('inf')
    except Exception:
        return False


def _safe_float(val, default=0.0):
    try:
        f = float(val)
        if f != f or abs(f) == float('inf'):
            return default
        return f
    except Exception:
        return default


def _handle_error(e):
    error_msg = str(e)
    if "index -1 is out of bounds" in error_msg or "0 with size 0" in error_msg or "No data" in error_msg:
        raise HTTPException(
            status_code=400,
            detail="One or more stocks have insufficient data for this period. Try a shorter period (1y or 2y) or check the ticker symbol."
        )
    if "No price data" in error_msg or "delisted" in error_msg.lower():
        raise HTTPException(
            status_code=400,
            detail="Could not fetch price data for one or more stocks. Please check the ticker symbol."
        )
    if "Not enough valid stocks" in error_msg or "Insufficient data" in error_msg:
        raise HTTPException(status_code=400, detail=error_msg)
    raise HTTPException(status_code=500, detail=f"Server error: {error_msg}")


@router.post("/analyze")
async def analyze_portfolio(req: PortfolioRequest):
    try:
        tickers, weights_dedup = _deduplicate_tickers(req.tickers, req.weights)

        prices    = fetch_prices(tickers, req.period)
        returns   = get_returns(prices)
        benchmark = fetch_benchmark(req.period)

        n = len(returns.columns)
        weights = _normalize_weights(weights_dedup, n)

        result = compute_portfolio_analytics(
            returns=returns,
            weights=weights,
            benchmark_returns=benchmark
        )

        bench_returns = benchmark.pct_change().dropna()
        bench_annual  = float(bench_returns.mean() * 252 * 100)

        try:
            result["insights"] = generate_insights(
                analytics=result,
                benchmark_return=round(bench_annual, 2)
            )
        except Exception:
            result["insights"] = []

        try:
            result["score"] = compute_portfolio_score(
                analytics=result,
                benchmark_return=round(bench_annual, 2)
            )
        except Exception:
            result["score"] = None

        # Add skipped stocks warning
        skipped = get_last_skipped()
        result["skipped_stocks"] = skipped

        return result
    except HTTPException:
        raise
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        _handle_error(e)


@router.get("/sample-tickers")
async def get_sample_tickers():
    return {
        "nifty50_samples": [
            "RELIANCE", "TCS", "HDFCBANK", "INFY", "ICICIBANK",
            "HINDUNILVR", "SBIN", "BHARTIARTL", "WIPRO", "KOTAKBANK",
            "LT", "AXISBANK", "ASIANPAINT", "MARUTI", "TITAN"
        ],
        "benchmark": "NIFTY 50",
        "note": "All NSE stocks — .NS suffix added automatically"
    }


@router.post("/monte-carlo")
async def monte_carlo(req: PortfolioRequest):
    try:
        tickers, weights_dedup = _deduplicate_tickers(req.tickers, req.weights)
        prices  = fetch_prices(tickers, req.period)
        returns = get_returns(prices)
        n = len(returns.columns)
        n_sims, _ = _get_scaling(n)
        result = run_monte_carlo(returns, n_simulations=n_sims)
        return result
    except HTTPException:
        raise
    except Exception as e:
        _handle_error(e)


@router.post("/var")
async def value_at_risk(req: PortfolioRequest):
    try:
        tickers, weights_dedup = _deduplicate_tickers(req.tickers, req.weights)
        prices  = fetch_prices(tickers, req.period)
        returns = get_returns(prices)
        n = len(returns.columns)
        weights = _normalize_weights(weights_dedup, n)
        result  = compute_var_metrics(returns, weights)
        return result
    except HTTPException:
        raise
    except Exception as e:
        _handle_error(e)


@router.post("/efficient-frontier")
async def efficient_frontier(req: PortfolioRequest):
    try:
        tickers, weights_dedup = _deduplicate_tickers(req.tickers, req.weights)
        prices  = fetch_prices(tickers, req.period)
        returns = get_returns(prices)
        n = len(returns.columns)
        _, n_points = _get_scaling(n)
        result = compute_efficient_frontier(returns, n_points=n_points)
        return result
    except HTTPException:
        raise
    except Exception as e:
        _handle_error(e)


@router.post("/returns-data")
async def get_returns_data(req: PortfolioRequest):
    try:
        tickers, _ = _deduplicate_tickers(req.tickers, req.weights)
        prices  = fetch_prices(tickers, req.period)
        returns = get_returns(prices)
        tickers_clean = [t.replace(".NS", "") for t in returns.columns.tolist()]
        return {
            "tickers": tickers_clean,
            "returns": returns.values.tolist()
        }
    except HTTPException:
        raise
    except Exception as e:
        _handle_error(e)


@router.post("/benchmark-comparison")
async def benchmark_comparison(req: PortfolioRequest):
    try:
        tickers, weights_dedup = _deduplicate_tickers(req.tickers, req.weights)
        prices    = fetch_prices(tickers, req.period)
        returns   = get_returns(prices)
        benchmark = fetch_benchmark(req.period)

        n = len(returns.columns)
        w = _normalize_weights(weights_dedup, n)

        port_daily      = returns.dot(w)
        port_cumulative = ((1 + port_daily).cumprod() - 1) * 100

        bench_returns    = benchmark.pct_change().dropna()
        bench_cumulative = ((1 + bench_returns).cumprod() - 1) * 100

        combined = pd.concat(
            [port_cumulative, bench_cumulative], axis=1
        ).dropna()
        combined.columns = ["portfolio", "nifty50"]
        combined.index   = combined.index.strftime("%Y-%m-%d")

        return {
            "dates":     combined.index.tolist(),
            "portfolio": combined["portfolio"].round(2).tolist(),
            "nifty50":   combined["nifty50"].round(2).tolist(),
        }
    except HTTPException:
        raise
    except Exception as e:
        _handle_error(e)


@router.post("/optimization-chart")
async def optimization_chart(req: PortfolioRequest):
    try:
        tickers, weights_dedup = _deduplicate_tickers(req.tickers, req.weights)

        prices  = fetch_prices(tickers, req.period)
        returns = get_returns(prices)

        n_stocks         = len(tickers)
        n_sims, n_points = _get_scaling(n_stocks)

        mc = run_monte_carlo(returns, n_simulations=n_sims)
        ef = compute_efficient_frontier(returns, n_points=n_points)

        n = len(returns.columns)
        weights = _normalize_weights(weights_dedup, n)

        analytics = compute_portfolio_analytics(
            returns=returns,
            weights=weights,
        )

        min_var_weights = _get_min_variance_weights(returns)

        clean_simulations = [
            {
                "risk":   mc["risks"][i],
                "return": mc["returns"][i],
                "sharpe": mc["sharpes"][i],
            }
            for i in range(len(mc["risks"]))
            if _is_valid(mc["risks"][i])
            and _is_valid(mc["returns"][i])
            and _is_valid(mc["sharpes"][i])
        ]

        clean_frontier = [
            {
                "risk":   ef["risks"][i],
                "return": ef["returns"][i],
            }
            for i in range(len(ef["risks"]))
            if _is_valid(ef["risks"][i])
            and _is_valid(ef["returns"][i])
        ]

        current = {
            "risk":   _safe_float(analytics["summary"]["annual_volatility_pct"]),
            "return": _safe_float(analytics["summary"]["annual_return_pct"]),
            "sharpe": _safe_float(analytics["summary"]["sharpe_ratio"]),
        }

        min_variance = {
            "risk":   _safe_float(ef["min_variance"]["risk"]),
            "return": _safe_float(ef["min_variance"]["return"]),
        }
        max_sharpe = {
            "risk":   _safe_float(ef["max_sharpe"]["risk"]),
            "return": _safe_float(ef["max_sharpe"]["return"]),
        }

        return {
            "simulations":          clean_simulations,
            "frontier":             clean_frontier,
            "current_portfolio":    current,
            "min_variance":         min_variance,
            "max_sharpe":           max_sharpe,
            "best_sharpe_weights":  mc["best_sharpe"]["weights"],
            "min_variance_weights": min_var_weights,
        }
    except HTTPException:
        raise
    except Exception as e:
        _handle_error(e)


@router.get("/search-stocks")
async def search_stocks(q: str = ""):
    try:
        from nse_stocks import search_stocks_list
        return search_stocks_list(q, limit=8)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/refresh-stocks")
async def refresh_stocks():
    try:
        import os
        if os.path.exists("stock_list_cache.json"):
            os.remove("stock_list_cache.json")
        from nse_stocks import get_all_stocks
        stocks = get_all_stocks()
        return {"message": f"Refreshed successfully — {len(stocks)} stocks loaded"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))