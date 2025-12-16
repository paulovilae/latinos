import time
import pandas as pd
import plotly.express as px
import plotly.graph_objects as go
from plotly.subplots import make_subplots
import streamlit as st

# Set page to wide mode
st.set_page_config(layout="wide")

# Function to read the CSV file
@st.cache_data(ttl=60)  # Cache for 60 seconds
def get_data(selected_stock: str, n_points: int = 100) -> pd.DataFrame:
    df = pd.read_csv("output.csv", header=0)
    if selected_stock != "All Stocks":
        df = df[df["stock_symbol"] == selected_stock]
    df['time'] = pd.to_datetime(df['time'])
    df = df.sort_values('time', ascending=False).head(n_points).reset_index(drop=True)
    numeric_columns = [col for col in df.columns if col not in ['time', 'stock_symbol']]
    df[numeric_columns] = df[numeric_columns].apply(pd.to_numeric, errors='coerce')
    return df

# Function to get the list of unique stocks from the CSV file
@st.cache_data
def get_stock_list() -> list:
    df = pd.read_csv("output.csv", header=0)
    return df["stock_symbol"].unique().tolist()

# Dashboard title
st.title("Real-Time Trade-Data Dashboard")

# Define the mapping of values to column names and labels
value_column_map = {
    "Value1": {"column": "close", "label": "Close"},
    "Value2": {"column": "rsi", "label": "RSI"},
    "Value3": {"column": "historic_volatility", "label": "Historic Volatility"}
}

# Top-level filters
stock_list = get_stock_list()
selected_stock = st.selectbox("Select Stock", ["All Stocks"] + stock_list)

# Select the value for the line chart
selected_value = st.selectbox("Select Value for Line Chart", list(value_column_map.keys()), format_func=lambda x: value_column_map[x]["label"])

# Create a single-element container
placeholder = st.empty()

# Main loop
while True:
    # Get the latest data
    df = get_data(selected_stock)

    with placeholder.container():
        # Create columns for KPIs
        kpi_columns = st.columns(len(value_column_map))

        # Fill in the KPIs with the latest data
        latest_data = df.iloc[0]
        
        def get_metric(value_name):
            column = value_column_map[value_name]["column"]
            if column in latest_data:
                value = round(float(latest_data[column]), 2)
                delta = round(float(latest_data[column]) - df[column].mean(), 2)
            else:
                value = "N/A"
                delta = None
            return value, delta

        for i, (value_name, value_info) in enumerate(value_column_map.items()):
            value, delta = get_metric(value_name)
            kpi_columns[i].metric(label=value_info["label"], value=value, delta=delta)

        # Create two columns for charts
        fig_col1, fig_col2 = st.columns(2)
        
        with fig_col1:
            st.markdown("### Metrics Heatmap")
            metric_columns = [value_info["column"] for value_info in value_column_map.values()]
            metric_labels = [value_info["label"] for value_info in value_column_map.values()]
            
            # Create a new DataFrame with the required columns
            df_metrics = df[['time'] + metric_columns].copy()
            
            # Melt the DataFrame to convert metric columns to a single column
            df_melted = pd.melt(df_metrics, id_vars=["time"], value_vars=metric_columns, var_name="Metric", value_name="Value")
            
            # Create the heatmap using Plotly Express
            fig = px.density_heatmap(df_melted, x="time", y="Metric", z="Value",
                                    labels=dict(x="Time", y="Metric", z="Value"),
                                    color_continuous_scale="Viridis",
                                    hover_data={"time": True, "Metric": True, "Value": ":.2f"})
            
            # Update the y-axis labels with metric labels
            fig.update_yaxes(tickvals=metric_columns, ticktext=metric_labels)
            
            # Update the layout
            fig.update_layout(height=400, title_text="Metrics Heatmap", showlegend=False)
            
            st.write(fig)
            
        with fig_col2:
            # Create line chart for the selected value
            column = value_column_map[selected_value]["column"]
            label = value_column_map[selected_value]["label"]
            
            st.markdown(f"### {label} Over Time")
            if column in df.columns:
                fig = px.line(df, x='time', y=column, title=f'{label} Over Time')
                fig.update_xaxes(range=[df['time'].min(), df['time'].max()])
                st.write(fig)
            else:
                st.write(f"Column '{column}' not found in the data.")

        st.markdown("### Detailed Data View")
        st.dataframe(df)
        
    # Wait for 60 seconds before the next update
    time.sleep(60)
