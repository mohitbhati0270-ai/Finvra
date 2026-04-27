import yfinance as yf
import pandas as pd
import numpy as np
from config import settings

_price_cache: dict = {}

def fetch_prices(tickers: list[str], period: str = "2y") -> pd.DataFrame:
    cache_key = f"{'-'.join(sorted(tickers))}_{period}"

    if cache_key in _price_cache:
        print(f"Cache hit for {cache_key}")
        return _price_cache[cache_key]

    print(f"Fetching from yfinance: {tickers}")

    # Fetch each ticker individually so bad ones don't kill the rest
    valid_frames = {}
    skipped      = []

    for ticker in tickers:
        try:
            raw = yf.download(
                ticker, period=period,
                auto_adjust=True, progress=False
            )["Close"]

            if raw is None or raw.empty:
                print(f"Skipping {ticker}: no data returned")
                skipped.append(ticker)
                continue

            series = raw.squeeze()

            # Must have at least 60 trading days of real data
            real_data_count = series.dropna().shape[0]
            if real_data_count < 60:
                print(f"Skipping {ticker}: only {real_data_count} days of data")
                skipped.append(ticker)
                continue

            valid_frames[ticker] = series

        except Exception as e:
            print(f"Skipping {ticker}: {str(e)}")
            skipped.append(ticker)
            continue

    if skipped:
        print(f"Skipped tickers due to insufficient data: {skipped}")

    if len(valid_frames) < 2:
        raise ValueError(
            f"Not enough valid stocks to analyse. "
            f"The following stocks had insufficient data or are not listed on NSE: "
            f"{', '.join(skipped)}. "
            f"Please check the ticker symbols or try a shorter period (1y)."
        )

    # Combine into DataFrame
    data = pd.DataFrame(valid_frames)

    # Forward fill small gaps (max 5 days)
    data = data.ffill(limit=5).bfill(limit=5)

    # Drop columns that still have more than 30% missing
    min_required = int(len(data) * 0.7)
    data = data.dropna(axis=1, thresh=min_required)

    if data.shape[1] < 2:
        raise ValueError(
            f"After cleaning, fewer than 2 stocks have sufficient data. "
            f"Skipped: {', '.join(skipped)}. Try different stocks or a shorter period."
        )

    # Fill any remaining small gaps with column mean
    data = data.fillna(data.mean())
    data = data.dropna(how='all')

    _price_cache[cache_key] = data
    return data


def get_returns(prices: pd.DataFrame) -> pd.DataFrame:
    returns = prices.pct_change().dropna(how='all')
    # Drop any columns that are all NaN after pct_change
    returns = returns.dropna(axis=1, how='all')
    # Fill small remaining gaps
    returns = returns.ffill().bfill()
    # Final drop of any rows with NaN
    returns = returns.dropna(how='any')
    return returns


def fetch_benchmark(period: str = "2y") -> pd.Series:
    bench = yf.download(
        settings.default_benchmark,
        period=period,
        auto_adjust=True,
        progress=False
    )["Close"]
    return bench.squeeze()