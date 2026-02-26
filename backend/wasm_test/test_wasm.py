import time
import os
import ctypes
from wasmtime import Store, Module, Instance, FuncType, ValType

def run_benchmark():
    # 1. Load the WASM module
    wasm_path = os.path.join(os.path.dirname(__file__), "target/wasm32-unknown-unknown/release/strategy.wasm")
    if not os.path.exists(wasm_path):
        print(f"Error: WASM file not found at {wasm_path}. Please compile first.")
        return

    print("Loading WASM module...")
    store = Store()
    module = Module.from_file(store.engine, wasm_path)
    instance = Instance(store, module, [])
    
    # Extract exported functions and the main WASM memory block
    process_batch = instance.exports(store)["process_batch"]
    memory = instance.exports(store)["memory"]
    
    num_candles = 175_000
    print(f"Generating {num_candles} simulated candles...")
    
    # Generate 1D array of f64 (8 bytes each): [open1, high1, low1, close1, rsi1, ...]
    input_size_bytes = num_candles * 5 * 8
    # Generate 1D array of i32 (4 bytes each): [signal1, signal2, ...]
    output_size_bytes = num_candles * 4
    
    total_needed_bytes = input_size_bytes + output_size_bytes
    
    # Ensure WASM memory is large enough (pages are 64KB)
    current_pages = memory.size(store)
    needed_pages = (total_needed_bytes // (64 * 1024)) + 1
    if current_pages < needed_pages:
        memory.grow(store, needed_pages - current_pages)
        
    input_ptr = 0
    output_ptr = input_size_bytes
    
    # Populate the memory buffer with dummy data
    # (1000.0, 1010.0, 990.0, 1005.0, 45.0)
    
    mem_view = memory.data_ptr(store)
    
    # This loop simulates building the Pandas dataframe into a flat array.
    # We don't count this in the execution benchmark because in a real scenario
    # we would do a zero-copy buffer transfer natively.
    ctypes_array_type = ctypes.c_double * (num_candles * 5)
    mem_view_inputs = ctypes_array_type.from_address(ctypes.addressof(mem_view.contents) + input_ptr)
    
    for i in range(num_candles):
        base = i * 5
        mem_view_inputs[base] = 1000.0   # Open
        mem_view_inputs[base+1] = 1010.0 # High
        mem_view_inputs[base+2] = 990.0  # Low
        mem_view_inputs[base+3] = 1005.0 # Close
        mem_view_inputs[base+4] = 45.0   # RSI
        
    # Inject triggers
    mem_view_inputs[5000*5 + 3] = 900.0 # BUY Close
    mem_view_inputs[5000*5 + 4] = 20.0  # BUY RSI
    mem_view_inputs[10000*5 + 3] = 1100.0 # SELL Close
    mem_view_inputs[10000*5 + 4] = 80.0   # SELL RSI

    print("\n--- Running WASM Benchmark (Matrix Batch Execution) ---")
    start_time_wasm = time.time()
    
    # Execute the WASM function ONE TIME, passing the pointers
    process_batch(store, input_ptr, output_ptr, num_candles)
    
    end_time_wasm = time.time()
    wasm_duration = end_time_wasm - start_time_wasm
    
    # Let's count the signals to prove it worked
    ctypes_output_type = ctypes.c_int32 * num_candles
    mem_view_outputs = ctypes_output_type.from_address(ctypes.addressof(mem_view.contents) + output_ptr)
    
    wasm_buys = 0
    wasm_sells = 0
    for i in range(num_candles):
        if mem_view_outputs[i] == 1: wasm_buys += 1
        elif mem_view_outputs[i] == -1: wasm_sells += 1
    
    print("\n--- Running Native Python Benchmark ---")
    
    data = [(1000.0, 1010.0, 990.0, 1005.0, 45.0) for _ in range(num_candles)]
    data[5000] = (1000.0, 1010.0, 990.0, 900.0, 20.0) # BUY
    data[10000] = (1000.0, 1010.0, 990.0, 1100.0, 80.0) # SELL
    
    def python_process_signal(close_p, rsi_p):
        if rsi_p < 30.0 and close_p < 1000.0: return 1
        if rsi_p > 70.0: return -1
        return 0

    start_time_py = time.time()
    
    py_buys = 0
    py_sells = 0
    for row in data:
        res = python_process_signal(row[3], row[4])
        if res == 1: py_buys += 1
        elif res == -1: py_sells += 1

    end_time_py = time.time()
    py_duration = end_time_py - start_time_py
    
    print("\n=== RESULTS ===")
    print(f"Data Points: {num_candles:,} Simulated Candles")
    print(f"WASM Exec Time:   {wasm_duration:.6f} seconds")
    print(f"Python Exec Time: {py_duration:.6f} seconds")
    if wasm_duration > 0:
        print(f"Speedup:          {py_duration / wasm_duration:.2f}x faster executing via WASM memory buffer")
    print(f"Sanity Check: WASM Buys/Sells = {wasm_buys}/{wasm_sells} | Python = {py_buys}/{py_sells}")

if __name__ == "__main__":
    run_benchmark()
