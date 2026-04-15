use crate::market_data::Candle;

pub struct WalkForwardWindow {
    pub train_start: usize,
    pub train_end: usize,
    pub test_start: usize,
    pub test_end: usize,
}

pub fn generate_walk_forward_matrices(
    total_candles: usize,
    train_size: usize,
    test_size: usize,
    step_size: usize,
) -> Vec<WalkForwardWindow> {
    let mut windows = Vec::new();
    let mut current_start = 0;

    while current_start + train_size + test_size <= total_candles {
        windows.push(WalkForwardWindow {
            train_start: current_start,
            train_end: current_start + train_size,
            test_start: current_start + train_size,
            test_end: current_start + train_size + test_size,
        });

        current_start += step_size;
    }

    windows
}

/// Slices a vector of candles based on indices
pub fn slice_candles(candles: &[Candle], start: usize, end: usize) -> Vec<Candle> {
    if start >= candles.len() || end > candles.len() || start >= end {
        return vec![];
    }
    candles[start..end].to_vec()
}
