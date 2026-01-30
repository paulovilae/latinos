# Guía de Simulación (Backesting) - Latinos Trading

## ¿Qué Significa el Resultado del Backtest?

El simulador ("Backtest") es una herramienta que **viaja al pasado** para responder a la pregunta:
**"¿Cuánto dinero habría ganado (o perdido) si hubiera seguido esta estrategia hace un año?"**

### 1. ¿Cómo Funciona la Simulación?

El sistema revisa día por día los precios de la acción (ej. Apple) durante el último año.

- **Día 1**: ¿Se cumplen tus señales? (ej. RSI < 30).
  - **SÍ (Verde)** -> El robot **COMPRA** una acción virtual al precio de ese día.
  - **NO (Rojo)** -> No hace nada.
- **Día 5**: ¿Se siguen cumpliendo tus señales?
  - **SÍ (Verde)** -> Mantiene la acción ("Hold").
  - **NO (Rojo)** -> El robot **VENDE** la acción al precio de ese día.

### 2. ¿Cómo se Calcula el Resultado (PnL)?

El **Total PnL** (Profit and Loss) es la suma de todas las ganancias y pérdidas de esas operaciones simuladas.

**Ejemplo Práctico:**

- **Operación 1 (Enero)**:
  - Compra a $100 (RSI < 30)
  - Vende a $110 (RSI > 30)
  - **Ganancia: +$10**
- **Operación 2 (Febrero)**:
  - Compra a $120 (RSI < 30)
  - Vende a $115 (RSI > 30)
  - **Pérdida: -$5**
- **RESULTADO FINAL**: +$5 (10 - 5)

Si tu resultado fue negativo, significa que tu estrategia **perdió dinero** en el pasado. ¡Mejor saberlo en simulación que con dinero real!

### 3. Interpretación de Métricas Clave

- **Total PnL (Ganancia Total)**:

  - 🟢 **Verde (Positivo)**: Tu estrategia ganó dinero.
  - 🔴 **Rojo (Negativo)**: Tu estrategia perdió dinero.

- **Win Rate (Tasa de Éxito)**:

  - Porcentaje de operaciones que terminaron en ganancia.
  - **Ejemplo 60%**: De 10 operaciones, 6 ganaron y 4 perdieron.

- **Total Trades (Operaciones)**:
  - Cuántas veces el robot compró y vendió.
  - **Pocos trades (1-5)**: Estrategia de largo plazo ("Trend Following").
  - **Muchos trades (20+)**: Estrategia de corto plazo ("Scalping").

### 4. Consejos para Mejorar tu Estrategia

- **Combina Señales**: Una sola señal (ej. RSI) suele fallar. Combina **Tendencia** (Media Móvil) con **Momento** (RSI) y **Confirmación** (Volumen).
- **Entiende tu Indicador**:
  - _Media Móvil (MA)_: Funciona bien cuando el precio sube o baja fuerte. Falla en mercados laterales.
  - _RSI_: Funciona bien en mercados laterales (rebotes). Falla en tendencias fuertes.
- **Prueba Diferentes Periodos**: Una estrategia puede funcionar en 1 año pero fallar en 1 mes.
