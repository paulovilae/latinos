/// Pure Rust technical indicator library.
///
/// All functions return `Vec<f64>` aligned with input length.
/// Warmup periods are filled with `f64::NAN`.

/// Simple Moving Average.
/// Returns NAN for indices < period-1.
pub fn sma(data: &[f64], period: usize) -> Vec<f64> {
    let n = data.len();
    let mut out = vec![f64::NAN; n];
    if period == 0 || n < period {
        return out;
    }
    let mut sum: f64 = data[..period].iter().sum();
    out[period - 1] = sum / period as f64;
    for i in period..n {
        sum += data[i] - data[i - period];
        out[i] = sum / period as f64;
    }
    out
}

/// Exponential Moving Average.
/// Returns NAN for indices < period-1.
pub fn ema(data: &[f64], period: usize) -> Vec<f64> {
    let n = data.len();
    let mut out = vec![f64::NAN; n];
    if period == 0 || n < period {
        return out;
    }
    let multiplier = 2.0 / (period as f64 + 1.0);
    // Seed with SMA
    let seed: f64 = data[..period].iter().sum::<f64>() / period as f64;
    out[period - 1] = seed;
    for i in period..n {
        out[i] = (data[i] - out[i - 1]) * multiplier + out[i - 1];
    }
    out
}

/// Relative Strength Index (Wilder's smoothing).
/// Returns NAN for indices < period.
pub fn rsi(data: &[f64], period: usize) -> Vec<f64> {
    let n = data.len();
    let mut out = vec![f64::NAN; n];
    if period == 0 || n <= period {
        return out;
    }

    let mut avg_gain = 0.0;
    let mut avg_loss = 0.0;

    // Initial average
    for i in 1..=period {
        let diff = data[i] - data[i - 1];
        if diff > 0.0 {
            avg_gain += diff;
        } else {
            avg_loss -= diff;
        }
    }
    avg_gain /= period as f64;
    avg_loss /= period as f64;

    let rs = if avg_loss == 0.0 {
        f64::INFINITY
    } else {
        avg_gain / avg_loss
    };
    out[period] = 100.0 - (100.0 / (1.0 + rs));

    // Subsequent values (Wilder's smoothing)
    let p = period as f64;
    for i in (period + 1)..n {
        let diff = data[i] - data[i - 1];
        let gain = if diff > 0.0 { diff } else { 0.0 };
        let loss = if diff < 0.0 { -diff } else { 0.0 };
        avg_gain = (avg_gain * (p - 1.0) + gain) / p;
        avg_loss = (avg_loss * (p - 1.0) + loss) / p;
        let rs = if avg_loss == 0.0 {
            f64::INFINITY
        } else {
            avg_gain / avg_loss
        };
        out[i] = 100.0 - (100.0 / (1.0 + rs));
    }
    out
}

/// MACD — returns (macd_line, signal_line, histogram).
/// All NAN until warmup (slow + signal - 1).
pub fn macd(
    data: &[f64],
    fast: usize,
    slow: usize,
    signal_period: usize,
) -> (Vec<f64>, Vec<f64>, Vec<f64>) {
    let n = data.len();
    let nan_vec = vec![f64::NAN; n];
    if fast >= slow || n < slow + signal_period {
        return (nan_vec.clone(), nan_vec.clone(), nan_vec);
    }

    let fast_ema = ema(data, fast);
    let slow_ema = ema(data, slow);

    let mut macd_line = vec![f64::NAN; n];
    for i in (slow - 1)..n {
        if !fast_ema[i].is_nan() && !slow_ema[i].is_nan() {
            macd_line[i] = fast_ema[i] - slow_ema[i];
        }
    }

    // Signal is EMA of MACD line (only non-NAN values)
    let macd_start = slow - 1;
    let macd_values: Vec<f64> = macd_line[macd_start..].to_vec();
    let signal_raw = ema(&macd_values, signal_period);

    let mut signal_line = vec![f64::NAN; n];
    let mut histogram = vec![f64::NAN; n];
    for (j, val) in signal_raw.iter().enumerate() {
        let i = macd_start + j;
        if !val.is_nan() && !macd_line[i].is_nan() {
            signal_line[i] = *val;
            histogram[i] = macd_line[i] - val;
        }
    }

    (macd_line, signal_line, histogram)
}

/// Bollinger Bands — returns (upper, middle, lower).
pub fn bollinger(data: &[f64], period: usize, num_std: f64) -> (Vec<f64>, Vec<f64>, Vec<f64>) {
    let n = data.len();
    let nan_vec = vec![f64::NAN; n];
    if period == 0 || n < period {
        return (nan_vec.clone(), nan_vec.clone(), nan_vec);
    }

    let middle = sma(data, period);
    let mut upper = vec![f64::NAN; n];
    let mut lower = vec![f64::NAN; n];

    for i in (period - 1)..n {
        let mean = middle[i];
        let variance: f64 = data[(i + 1 - period)..=i]
            .iter()
            .map(|x| (x - mean).powi(2))
            .sum::<f64>()
            / period as f64;
        let std_dev = variance.sqrt();
        upper[i] = mean + num_std * std_dev;
        lower[i] = mean - num_std * std_dev;
    }

    (upper, middle, lower)
}

/// Bollinger Bandwidth — (upper - lower) / middle * 100.
pub fn bollinger_bandwidth(data: &[f64], period: usize, num_std: f64) -> Vec<f64> {
    let (upper, middle, lower) = bollinger(data, period, num_std);
    let n = data.len();
    let mut out = vec![f64::NAN; n];
    for i in 0..n {
        if !upper[i].is_nan() && !lower[i].is_nan() && middle[i] != 0.0 {
            out[i] = (upper[i] - lower[i]) / middle[i] * 100.0;
        }
    }
    out
}

/// Average True Range.
pub fn atr(highs: &[f64], lows: &[f64], closes: &[f64], period: usize) -> Vec<f64> {
    let n = highs.len();
    let mut out = vec![f64::NAN; n];
    if period == 0 || n <= period {
        return out;
    }

    // True Range
    let mut tr = vec![0.0; n];
    tr[0] = highs[0] - lows[0];
    for i in 1..n {
        let hl = highs[i] - lows[i];
        let hc = (highs[i] - closes[i - 1]).abs();
        let lc = (lows[i] - closes[i - 1]).abs();
        tr[i] = hl.max(hc).max(lc);
    }

    // Initial ATR = average of first `period` TRs
    let initial: f64 = tr[1..=period].iter().sum::<f64>() / period as f64;
    out[period] = initial;

    // Wilder's smoothing
    let p = period as f64;
    for i in (period + 1)..n {
        out[i] = (out[i - 1] * (p - 1.0) + tr[i]) / p;
    }
    out
}

/// Volume Moving Average.
pub fn volume_ma(volumes: &[f64], period: usize) -> Vec<f64> {
    sma(volumes, period)
}

/// Stochastic Oscillator %K.
/// %K = (close - lowest_low) / (highest_high - lowest_low) * 100
pub fn stochastic_k(
    highs: &[f64],
    lows: &[f64],
    closes: &[f64],
    period: usize,
) -> Vec<f64> {
    let n = closes.len();
    let mut out = vec![f64::NAN; n];
    if period == 0 || n < period {
        return out;
    }
    for i in (period - 1)..n {
        let window_start = i + 1 - period;
        let highest = highs[window_start..=i]
            .iter()
            .cloned()
            .fold(f64::NEG_INFINITY, f64::max);
        let lowest = lows[window_start..=i]
            .iter()
            .cloned()
            .fold(f64::INFINITY, f64::min);
        let range = highest - lowest;
        if range > 0.0 {
            out[i] = (closes[i] - lowest) / range * 100.0;
        } else {
            out[i] = 50.0;
        }
    }
    out
}

/// ADX — Average Directional Index.
/// Returns ADX values (NAN for warmup ~ 2*period).
pub fn adx(highs: &[f64], lows: &[f64], closes: &[f64], period: usize) -> Vec<f64> {
    let n = highs.len();
    let mut out = vec![f64::NAN; n];
    if period == 0 || n < 2 * period + 1 {
        return out;
    }

    // +DM, -DM
    let mut plus_dm = vec![0.0; n];
    let mut minus_dm = vec![0.0; n];
    let mut tr = vec![0.0; n];

    for i in 1..n {
        let up = highs[i] - highs[i - 1];
        let down = lows[i - 1] - lows[i];
        plus_dm[i] = if up > down && up > 0.0 { up } else { 0.0 };
        minus_dm[i] = if down > up && down > 0.0 { down } else { 0.0 };

        let hl = highs[i] - lows[i];
        let hc = (highs[i] - closes[i - 1]).abs();
        let lc = (lows[i] - closes[i - 1]).abs();
        tr[i] = hl.max(hc).max(lc);
    }

    // Smoothed using Wilder's
    let p = period as f64;
    let mut smoothed_tr = 0.0;
    let mut smoothed_plus = 0.0;
    let mut smoothed_minus = 0.0;

    for i in 1..=period {
        smoothed_tr += tr[i];
        smoothed_plus += plus_dm[i];
        smoothed_minus += minus_dm[i];
    }

    let mut dx_values: Vec<f64> = Vec::new();

    for i in period..n {
        if i > period {
            smoothed_tr = smoothed_tr - (smoothed_tr / p) + tr[i];
            smoothed_plus = smoothed_plus - (smoothed_plus / p) + plus_dm[i];
            smoothed_minus = smoothed_minus - (smoothed_minus / p) + minus_dm[i];
        }

        let plus_di = if smoothed_tr > 0.0 {
            smoothed_plus / smoothed_tr * 100.0
        } else {
            0.0
        };
        let minus_di = if smoothed_tr > 0.0 {
            smoothed_minus / smoothed_tr * 100.0
        } else {
            0.0
        };
        let di_sum = plus_di + minus_di;
        let dx = if di_sum > 0.0 {
            ((plus_di - minus_di).abs() / di_sum) * 100.0
        } else {
            0.0
        };
        dx_values.push(dx);
    }

    // ADX = SMA of DX over `period`
    if dx_values.len() >= period {
        let mut adx_val: f64 = dx_values[..period].iter().sum::<f64>() / p;
        out[2 * period - 1] = adx_val;
        for j in period..dx_values.len() {
            adx_val = (adx_val * (p - 1.0) + dx_values[j]) / p;
            out[period + j] = adx_val;
        }
    }

    out
}

/// Williams %R.
/// Williams %R = (highest_high - close) / (highest_high - lowest_low) * -100
pub fn williams_r(
    highs: &[f64],
    lows: &[f64],
    closes: &[f64],
    period: usize,
) -> Vec<f64> {
    let n = closes.len();
    let mut out = vec![f64::NAN; n];
    if period == 0 || n < period {
        return out;
    }
    for i in (period - 1)..n {
        let window_start = i + 1 - period;
        let highest = highs[window_start..=i]
            .iter()
            .cloned()
            .fold(f64::NEG_INFINITY, f64::max);
        let lowest = lows[window_start..=i]
            .iter()
            .cloned()
            .fold(f64::INFINITY, f64::min);
        let range = highest - lowest;
        if range > 0.0 {
            out[i] = (highest - closes[i]) / range * -100.0;
        } else {
            out[i] = -50.0;
        }
    }
    out
}

/// SuperTrend indicator.
/// Returns (supertrend_values, direction): direction = 1 for bullish, -1 for bearish.
pub fn supertrend(
    highs: &[f64],
    lows: &[f64],
    closes: &[f64],
    period: usize,
    multiplier: f64,
) -> (Vec<f64>, Vec<i32>) {
    let n = closes.len();
    let mut st = vec![f64::NAN; n];
    let mut direction = vec![0i32; n];
    if period == 0 || n <= period {
        return (st, direction);
    }

    let atr_vals = atr(highs, lows, closes, period);

    let mut upper_band = vec![0.0; n];
    let mut lower_band = vec![0.0; n];

    for i in period..n {
        if atr_vals[i].is_nan() {
            continue;
        }
        let hl2 = (highs[i] + lows[i]) / 2.0;
        let basic_upper = hl2 + multiplier * atr_vals[i];
        let basic_lower = hl2 - multiplier * atr_vals[i];

        upper_band[i] = if i > period && basic_upper < upper_band[i - 1] || closes[i - 1] > upper_band[i - 1] {
            basic_upper
        } else {
            upper_band[i - 1]
        };

        lower_band[i] = if i > period && basic_lower > lower_band[i - 1] || closes[i - 1] < lower_band[i - 1] {
            basic_lower
        } else {
            lower_band[i - 1]
        };

        // Direction
        if i == period {
            direction[i] = if closes[i] > upper_band[i] { 1 } else { -1 };
        } else {
            if direction[i - 1] == -1 && closes[i] > upper_band[i] {
                direction[i] = 1;
            } else if direction[i - 1] == 1 && closes[i] < lower_band[i] {
                direction[i] = -1;
            } else {
                direction[i] = direction[i - 1];
            }
        }

        st[i] = if direction[i] == 1 {
            lower_band[i]
        } else {
            upper_band[i]
        };
    }

    (st, direction)
}

/// VWAP — Volume Weighted Average Price.
/// Assumes intraday (no session reset).
pub fn vwap(highs: &[f64], lows: &[f64], closes: &[f64], volumes: &[f64]) -> Vec<f64> {
    let n = closes.len();
    let mut out = vec![f64::NAN; n];
    let mut cumulative_tp_vol = 0.0;
    let mut cumulative_vol = 0.0;

    for i in 0..n {
        let typical_price = (highs[i] + lows[i] + closes[i]) / 3.0;
        cumulative_tp_vol += typical_price * volumes[i];
        cumulative_vol += volumes[i];
        if cumulative_vol > 0.0 {
            out[i] = cumulative_tp_vol / cumulative_vol;
        }
    }
    out
}

#[cfg(test)]
mod tests {
    use super::*;

    fn approx_eq(a: f64, b: f64, eps: f64) -> bool {
        (a - b).abs() < eps
    }

    #[test]
    fn test_sma_basic() {
        let data = vec![1.0, 2.0, 3.0, 4.0, 5.0];
        let result = sma(&data, 3);
        assert!(result[0].is_nan());
        assert!(result[1].is_nan());
        assert!(approx_eq(result[2], 2.0, 1e-10));
        assert!(approx_eq(result[3], 3.0, 1e-10));
        assert!(approx_eq(result[4], 4.0, 1e-10));
    }

    #[test]
    fn test_rsi_range() {
        let data: Vec<f64> = (0..100).map(|i| 50.0 + (i as f64).sin() * 10.0).collect();
        let result = rsi(&data, 14);
        for val in result.iter().skip(14) {
            assert!(*val >= 0.0 && *val <= 100.0, "RSI out of range: {}", val);
        }
    }

    #[test]
    fn test_ema_converges() {
        let data = vec![10.0; 50];
        let result = ema(&data, 10);
        assert!(approx_eq(result[49], 10.0, 1e-10));
    }

    #[test]
    fn test_bollinger_symmetry() {
        let data: Vec<f64> = (0..30).map(|i| 100.0 + (i as f64) * 0.5).collect();
        let (upper, middle, lower) = bollinger(&data, 20, 2.0);
        for i in 19..30 {
            let spread_up = upper[i] - middle[i];
            let spread_down = middle[i] - lower[i];
            assert!(approx_eq(spread_up, spread_down, 1e-10));
        }
    }

    #[test]
    fn test_williams_r_range() {
        let highs: Vec<f64> = (0..50).map(|i| 110.0 + (i as f64).sin() * 5.0).collect();
        let lows: Vec<f64> = (0..50).map(|i| 90.0 + (i as f64).sin() * 5.0).collect();
        let closes: Vec<f64> = (0..50).map(|i| 100.0 + (i as f64).sin() * 5.0).collect();
        let result = williams_r(&highs, &lows, &closes, 14);
        for val in result.iter().skip(13) {
            assert!(
                *val >= -100.0 && *val <= 0.0,
                "Williams %R out of range: {}",
                val
            );
        }
    }
}
