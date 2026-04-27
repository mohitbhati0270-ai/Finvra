import numpy as np
import pandas as pd
from scipy import stats
from scipy.optimize import minimize
from config import settings


def _safe(val, default=0.0):
    """Return default if val is NaN or Inf."""
    try:
        f = float(val)
        return default if (f != f or abs(f) == float('inf')) else f
    except Exception:
        return default


def compute_portfolio_analytics(
    returns: pd.DataFrame,
    weights: list[float],
    benchmark_returns: pd.Series | None = None
) -> dict:

    # Drop columns that are all NaN
    returns = returns.dropna(axis=1, how='all')
    returns = returns.dropna(axis=1, thresh=int(len(returns) * 0.7))
    returns = returns.ffill().bfill()
    returns = returns.dropna(axis=0, how='any')

    if returns.empty or len(returns.columns) < 2:
        raise ValueError("Insufficient data after cleaning. Check your stock tickers.")

    w = np.array(weights[:len(returns.columns)])
    total = w.sum()
    if total > 0:
        w = w / total

    T  = settings.trading_days
    Rf = settings.risk_free_rate

    mean_daily = returns.mean()
    cov_daily  = returns.cov()

    ann_returns = mean_daily * T
    ann_cov     = cov_daily  * T

    port_return   = _safe(np.dot(w, ann_returns))
    port_variance = _safe(np.dot(w, np.dot(ann_cov, w)))
    port_vol      = _safe(np.sqrt(max(port_variance, 0)))
    sharpe        = _safe((port_return - Rf) / port_vol) if port_vol > 0 else 0.0

    corr = returns.corr().round(4).fillna(0).to_dict()

    stock_stats = []
    for i, ticker in enumerate(returns.columns):
        r = _safe(ann_returns.iloc[i])
        v = _safe(np.sqrt(max(float(ann_cov.iloc[i, i]), 0)))

        beta = 1.0
        if benchmark_returns is not None:
            try:
                bench_r = benchmark_returns.pct_change().dropna()
                aligned = pd.concat(
                    [returns[ticker], bench_r], axis=1
                ).dropna()
                if len(aligned) >= 10:
                    cov_bm = float(np.cov(aligned.iloc[:, 0], aligned.iloc[:, 1])[0][1])
                    var_bm = float(aligned.iloc[:, 1].var())
                    beta   = _safe(cov_bm / var_bm, 1.0) if var_bm > 0 else 1.0
            except Exception:
                beta = 1.0

        marginal         = _safe(np.dot(ann_cov.iloc[i], w)) / port_vol if port_vol > 0 else 0
        risk_contribution = _safe(w[i] * marginal / port_vol) if port_vol > 0 else 0

        stock_stats.append({
            "ticker":               ticker.replace(".NS", ""),
            "weight":               round(float(w[i]) * 100, 2),
            "annual_return":        round(r * 100, 2),
            "annual_volatility":    round(v * 100, 2),
            "beta":                 round(beta, 4),
            "risk_contribution_pct": round(risk_contribution * 100, 2),
        })

    port_beta = 1.0
    if benchmark_returns is not None:
        try:
            port_daily_returns = returns.dot(w)
            bench_r = benchmark_returns.pct_change().dropna()
            aligned = pd.concat([port_daily_returns, bench_r], axis=1).dropna()
            if len(aligned) >= 10:
                cov_pb  = float(np.cov(aligned.iloc[:, 0], aligned.iloc[:, 1])[0][1])
                var_b   = float(aligned.iloc[:, 1].var())
                port_beta = _safe(cov_pb / var_b, 1.0) if var_b > 0 else 1.0
        except Exception:
            port_beta = 1.0

    return {
        "summary": {
            "annual_return_pct":     round(port_return * 100, 2),
            "annual_volatility_pct": round(port_vol * 100, 2),
            "sharpe_ratio":          round(sharpe, 4),
            "portfolio_beta":        round(port_beta, 4),
            "currency":              "INR",
        },
        "stocks":             stock_stats,
        "correlation_matrix": corr,
    }


def run_monte_carlo(
    returns: pd.DataFrame,
    n_simulations: int = 5000
) -> dict:
    returns      = returns.dropna(axis=1, how='all').dropna(axis=1, thresh=int(len(returns)*0.7)).ffill().bfill().dropna(axis=0, how='any')
    mean_returns = returns.mean() * 252
    cov_matrix   = returns.cov() * 252
    n            = len(mean_returns)
    Rf           = settings.risk_free_rate

    sim_returns, sim_risks, sim_sharpes, sim_weights = [], [], [], []

    for _ in range(n_simulations):
        w = np.random.dirichlet(np.ones(n))
        r = _safe(np.dot(w, mean_returns))
        v = _safe(np.sqrt(max(float(np.dot(w, np.dot(cov_matrix, w))), 0)))
        s = _safe((r - Rf) / v) if v > 0 else 0.0
        sim_returns.append(round(r * 100, 3))
        sim_risks.append(round(v * 100, 3))
        sim_sharpes.append(round(s, 4))
        sim_weights.append(w.tolist())

    best_idx = int(np.argmax(sim_sharpes))
    tickers  = [t.replace(".NS", "") for t in returns.columns]

    return {
        "returns": sim_returns,
        "risks":   sim_risks,
        "sharpes": sim_sharpes,
        "best_sharpe": {
            "return":  sim_returns[best_idx],
            "risk":    sim_risks[best_idx],
            "sharpe":  sim_sharpes[best_idx],
            "weights": {
                tickers[i]: round(sim_weights[best_idx][i] * 100, 2)
                for i in range(n)
            }
        }
    }


def compute_var_metrics(
    returns: pd.DataFrame,
    weights: list[float],
    confidence_levels: list = [0.90, 0.95, 0.99]
) -> dict:
    from scipy.stats import norm, skew, kurtosis

    # Clean data first
    returns = returns.dropna(axis=1, how='all').dropna(axis=1, thresh=int(len(returns)*0.7)).ffill().bfill()

    if returns.empty:
        raise ValueError("Insufficient data to compute VaR metrics.")

    w = np.array(weights[:len(returns.columns)])
    total = w.sum()
    if total > 0:
        w = w / total

    port_returns = returns.dot(w)

    # Drop any remaining NaN
    port_returns = port_returns.dropna()

    if len(port_returns) < 10:
        raise ValueError("Insufficient data to compute VaR metrics.")

    # Replace any inf values
    port_returns = port_returns.replace([np.inf, -np.inf], np.nan).dropna()

    if len(port_returns) < 10:
        raise ValueError("Insufficient data after cleaning for VaR metrics.")

    results = {}

    for cl in confidence_levels:
        alpha    = 1 - cl
        hist_var = _safe(-np.percentile(port_returns, alpha * 100))
        below    = port_returns[port_returns <= -hist_var]
        cvar     = _safe(-below.mean()) if len(below) > 0 else hist_var

        mu      = _safe(port_returns.mean())
        sigma   = _safe(port_returns.std())
        z       = float(norm.ppf(alpha))

        param_var = _safe(-(mu + z * sigma))

        try:
            S     = _safe(skew(port_returns))
            K     = _safe(kurtosis(port_returns))
            z_cf  = z + (z**2-1)/6*S + (z**3-3*z)/24*K - (2*z**3-5*z)/36*S**2
            mod_var = _safe(-(mu + z_cf * sigma))
        except Exception:
            mod_var = param_var

        results[f"{int(cl*100)}"] = {
            "historical_var": round(hist_var * 100, 4),
            "cvar":           round(cvar * 100, 4),
            "parametric_var": round(param_var * 100, 4),
            "modified_var":   round(mod_var * 100, 4),
        }

    results["note"] = "Daily VaR % — multiply by sqrt(252) for annual"
    return results


def compute_efficient_frontier(
    returns: pd.DataFrame,
    n_points: int = 60
) -> dict:
    returns      = returns.dropna(axis=1, how='all').dropna(axis=1, thresh=int(len(returns)*0.7)).ffill().bfill().dropna(axis=0, how='any')
    mean_returns = returns.mean() * 252
    cov_matrix   = returns.cov() * 252
    n            = len(mean_returns)
    Rf           = settings.risk_free_rate

    bounds           = tuple((0, 1) for _ in range(n))
    x0               = np.array([1/n] * n)
    base_constraints = [{"type": "eq", "fun": lambda w: np.sum(w) - 1}]

    def portfolio_vol(w):
        return _safe(np.sqrt(max(float(np.dot(w, np.dot(cov_matrix, w))), 0)))

    def portfolio_ret(w):
        return _safe(np.dot(w, mean_returns))

    min_var_result = minimize(
        portfolio_vol, x0=x0, method="SLSQP",
        bounds=bounds, constraints=base_constraints
    )
    min_vol = portfolio_vol(min_var_result.x)
    min_ret = portfolio_ret(min_var_result.x)

    max_ret_result = minimize(
        lambda w: -portfolio_ret(w), x0=x0, method="SLSQP",
        bounds=bounds, constraints=base_constraints
    )
    max_ret = portfolio_ret(max_ret_result.x)

    target_returns   = np.linspace(min_ret * 1.001, max_ret * 0.999, n_points)
    frontier_risks   = []
    frontier_returns = []
    frontier_sharpes = []

    for target in target_returns:
        constraints = [
            {"type": "eq", "fun": lambda w: np.sum(w) - 1},
            {"type": "eq", "fun": lambda w, t=target: portfolio_ret(w) - t},
        ]
        result = minimize(
            portfolio_vol, x0=x0, method="SLSQP",
            bounds=bounds, constraints=constraints,
            options={"ftol": 1e-9, "maxiter": 1000}
        )
        if result.success:
            vol    = portfolio_vol(result.x)
            ret    = portfolio_ret(result.x)
            sharpe = _safe((ret - Rf) / vol) if vol > 0 else 0
            frontier_risks.append(round(vol * 100, 4))
            frontier_returns.append(round(ret * 100, 4))
            frontier_sharpes.append(round(sharpe, 4))

    if frontier_risks:
        combined = sorted(
            zip(frontier_risks, frontier_returns, frontier_sharpes),
            key=lambda x: x[0]
        )
        frontier_risks   = [x[0] for x in combined]
        frontier_returns = [x[1] for x in combined]
        frontier_sharpes = [x[2] for x in combined]

    max_sharpe_idx = int(np.argmax(frontier_sharpes)) if frontier_sharpes else 0

    return {
        "risks":    frontier_risks,
        "returns":  frontier_returns,
        "sharpes":  frontier_sharpes,
        "min_variance": {
            "risk":   round(_safe(min_vol * 100), 2),
            "return": round(_safe(min_ret * 100), 2),
        },
        "max_sharpe": {
            "risk":   frontier_risks[max_sharpe_idx] if frontier_risks else 0,
            "return": frontier_returns[max_sharpe_idx] if frontier_returns else 0,
        }
    }


def generate_insights(
    analytics: dict,
    benchmark_return: float | None = None
) -> list[str]:
    insights = []
    summary  = analytics["summary"]
    stocks   = analytics["stocks"]

    port_return = summary["annual_return_pct"]
    port_vol    = summary["annual_volatility_pct"]
    sharpe      = summary["sharpe_ratio"]
    beta        = summary["portfolio_beta"]

    if benchmark_return is not None:
        diff = round(port_return - benchmark_return, 2)
        if diff > 0:
            insights.append(f"Your portfolio returned {port_return:+.2f}% vs NIFTY 50's {benchmark_return:+.2f}% — you are outperforming the market by {abs(diff):.2f}%. Keep it up!")
        else:
            insights.append(f"Your portfolio returned {port_return:+.2f}% vs NIFTY 50's {benchmark_return:+.2f}% — you are underperforming the market by {abs(diff):.2f}%. Consider rebalancing.")
    else:
        if port_return > 0:
            insights.append(f"Your portfolio has generated a positive return of {port_return:+.2f}% annually.")
        else:
            insights.append(f"Your portfolio is down {port_return:.2f}% annually. Review your holdings.")

    if sharpe >= 1.0:
        insights.append(f"Excellent Sharpe Ratio of {sharpe:.2f} — your returns well justify the risk taken.")
    elif sharpe >= 0.5:
        insights.append(f"Good Sharpe Ratio of {sharpe:.2f} — returns reasonably justify the risk.")
    elif sharpe >= 0:
        insights.append(f"Low Sharpe Ratio of {sharpe:.2f} — returns barely justify the risk. Consider adding lower-risk stocks.")
    else:
        insights.append(f"Negative Sharpe Ratio of {sharpe:.2f} — a fixed deposit at 6.5% is currently beating your portfolio on a risk-adjusted basis. Review your stock selection.")

    sorted_by_risk = sorted(stocks, key=lambda x: x["risk_contribution_pct"], reverse=True)
    top = sorted_by_risk[0]
    if top["risk_contribution_pct"] > 35:
        insights.append(f"{top['ticker']} contributes {top['risk_contribution_pct']:.1f}% of your total portfolio risk despite only {top['weight']:.1f}% weight — high concentration risk. Consider reducing it below 25%.")
    elif top["risk_contribution_pct"] > 25:
        insights.append(f"{top['ticker']} is your biggest risk driver at {top['risk_contribution_pct']:.1f}% risk contribution. Monitor this position closely.")
    else:
        insights.append(f"Your portfolio is well diversified — no single stock dominates risk. {top['ticker']} is the largest contributor at {top['risk_contribution_pct']:.1f}%.")

    if beta > 1.2:
        insights.append(f"High portfolio beta of {beta:.2f} — your portfolio is {((beta-1)*100):.0f}% more volatile than NIFTY 50.")
    elif beta > 1.0:
        insights.append(f"Portfolio beta of {beta:.2f} — slightly more aggressive than NIFTY 50. Good for bull markets but adds downside risk.")
    elif beta > 0.8:
        insights.append(f"Portfolio beta of {beta:.2f} — slightly defensive. Your portfolio moves a little less than the market, offering some downside protection.")
    else:
        insights.append(f"Low beta of {beta:.2f} — your portfolio is quite defensive and will be less affected by market crashes.")

    return insights[:4]


def compute_portfolio_score(
    analytics: dict,
    benchmark_return: float | None = None
) -> dict:
    summary = analytics["summary"]
    stocks  = analytics["stocks"]

    port_return = summary["annual_return_pct"]
    port_vol    = summary["annual_volatility_pct"]
    sharpe      = summary["sharpe_ratio"]
    beta        = summary["portfolio_beta"]

    scores = {}

    if benchmark_return is not None:
        diff = port_return - benchmark_return
        if diff >= 5:     r_score = 20
        elif diff >= 2:   r_score = 16
        elif diff >= 0:   r_score = 12
        elif diff >= -5:  r_score = 8
        elif diff >= -10: r_score = 4
        else:             r_score = 0
    else:
        if port_return >= 15:   r_score = 20
        elif port_return >= 10: r_score = 16
        elif port_return >= 6:  r_score = 12
        elif port_return >= 0:  r_score = 8
        elif port_return >= -5: r_score = 4
        else:                   r_score = 0
    scores["returns"] = r_score

    if sharpe >= 1.5:    s_score = 20
    elif sharpe >= 1.0:  s_score = 16
    elif sharpe >= 0.5:  s_score = 12
    elif sharpe >= 0:    s_score = 8
    elif sharpe >= -0.5: s_score = 4
    else:                s_score = 0
    scores["sharpe"] = s_score

    top_risk = max(s["risk_contribution_pct"] for s in stocks)
    n_stocks = len(stocks)
    if top_risk <= 20 and n_stocks >= 5:   d_score = 20
    elif top_risk <= 25 and n_stocks >= 4: d_score = 16
    elif top_risk <= 30:                   d_score = 12
    elif top_risk <= 40:                   d_score = 8
    elif top_risk <= 50:                   d_score = 4
    else:                                  d_score = 0
    scores["diversification"] = d_score

    if 0.8 <= beta <= 1.1:   b_score = 20
    elif 0.6 <= beta <= 1.3: b_score = 16
    elif 0.4 <= beta <= 1.5: b_score = 12
    elif 0.2 <= beta <= 1.8: b_score = 8
    elif beta <= 2.0:        b_score = 4
    else:                    b_score = 0
    scores["beta"] = b_score

    if port_vol <= 12:   v_score = 20
    elif port_vol <= 15: v_score = 16
    elif port_vol <= 20: v_score = 12
    elif port_vol <= 25: v_score = 8
    elif port_vol <= 30: v_score = 4
    else:                v_score = 0
    scores["volatility"] = v_score

    total = sum(scores.values())

    if total >= 80:   grade, label = "A", "Excellent"
    elif total >= 60: grade, label = "B", "Good"
    elif total >= 40: grade, label = "C", "Average"
    elif total >= 20: grade, label = "D", "Poor"
    else:             grade, label = "F", "Very Poor"

    return {
        "total": total,
        "grade": grade,
        "label": label,
        "breakdown": {
            "returns":         {"score": scores["returns"],         "max": 20, "label": "Returns vs Benchmark"},
            "sharpe":          {"score": scores["sharpe"],          "max": 20, "label": "Risk-Adjusted Return"},
            "diversification": {"score": scores["diversification"], "max": 20, "label": "Diversification"},
            "beta":            {"score": scores["beta"],            "max": 20, "label": "Market Sensitivity"},
            "volatility":      {"score": scores["volatility"],      "max": 20, "label": "Volatility"},
        }
    }