export type Language = "en" | "es";

export const translations = {
  dashboardTitle: { en: "Dashboard", es: "Tablero" },
  dashboardSubtitle: {
    en: "Orchestrate bots, formulas, signals, backtests, and billing.",
    es: "Orquesta bots, fórmulas, señales, backtests y facturación.",
  },
  navBots: { en: "Bots", es: "Bots" },
  navUsers: { en: "Users", es: "Usuarios" },
  navFormulas: { en: "Formulas", es: "Fórmulas" },
  navSignals: { en: "Live Trading", es: "Trading en Vivo" },
  navSignalsPage: { en: "Signals", es: "Señales" },
  navRobotsPage: { en: "Robots", es: "Robots" },
  navBacktests: { en: "Backtests", es: "Backtests" },
  navBilling: { en: "Billing", es: "Facturación" },
  strategyTitle: { en: "Strategy workbench", es: "Banco de estrategias" },
  strategyDescription: {
    en: "Edit formula payloads, pick symbols, and preview real prices + plots.",
    es: "Edita fórmulas, elige símbolos y visualiza precios y gráficos reales.",
  },
  botsTitle: { en: "Bots", es: "Bots" },
  botsDescription: {
    en: "CRUD + deploy/pause flows backed by FastAPI",
    es: "Flujos de creación y despliegue respaldados por FastAPI",
  },
  usersTitle: { en: "User management", es: "Gestión de usuarios" },
  usersDescription: {
    en: "Invite teammates, toggle MFA, and prune accounts.",
    es: "Invita compañeros, activa MFA y elimina cuentas.",
  },
  formulasTitle: {
    en: "Formulas",
    es: "Fórmulas",
  },
  formulasDescription: {
    en: "Versioned strategy payloads with publish toggles and history",
    es: "Estrategias versionadas con publicación y historial",
  },
  signalsTitle: { en: "Live Trading", es: "Trading en Vivo" },
  signalsDescription: {
    en: "Websocket-friendly feed for buy/sell/info events with delivery state",
    es: "Feed de eventos de compra/venta con estado de entrega",
  },
  backtestsTitle: { en: "Backtests", es: "Backtests" },
  backtestsDescription: {
    en: "Celery workers process submissions; results stream back to dashboard",
    es: "Los workers procesan envíos y devuelven resultados al tablero",
  },
  billingTitle: { en: "Billing", es: "Planes y facturación" },
  billingDescription: {
    en: "Stripe checkout + customer portal links",
    es: "Planes gestionados con Stripe y portal del cliente",
  },
  operationsTitle: { en: "Operations", es: "Operaciones" },
  operationsDescription: {
    en: "Health, metrics, audit log observability",
    es: "Salud, métricas y auditoría",
  },
  stockUniverse: {
    en: "Stock universe",
    es: "Universo de acciones",
  },
  stockUniverseSubtitle: {
    en: "Pick the names the formula should target.",
    es: "Elige los símbolos que operará la fórmula.",
  },
  livePriceFeed: {
    en: "Live price feed",
    es: "Precio en vivo",
  },
  livePriceSubtitle: {
    en: "Data comes straight from Yahoo! Finance fallback.",
    es: "Datos directos de Yahoo! Finance con respaldo local.",
  },
  formulaEditorTitle: {
    en: "Formula JSON editor",
    es: "Editor JSON de fórmulas",
  },
  payloadPreview: {
    en: "API payload preview",
    es: "Vista previa del payload",
  },
  readyToSend: {
    en: "Ready-to-send body for PUT /formulas/123",
    es: "Body listo para PUT /formulas/123",
  },
  inviteUser: {
    en: "Invite user",
    es: "Invitar usuario",
  },
  refresh: {
    en: "Refresh",
    es: "Actualizar",
  },
  addSymbol: {
    en: "Add symbol",
    es: "Agregar símbolo",
  },
  tableName: { en: "Name", es: "Nombre" },
  tableStatus: { en: "Status", es: "Estado" },
  tableTags: { en: "Tags", es: "Etiquetas" },
  tableOwner: { en: "Owner", es: "Propietario" },
  tableActions: { en: "Actions", es: "Acciones" },
  deployBtn: { en: "Deploy", es: "Activar" },
  pauseBtn: { en: "Pause", es: "Pausar" },
  deleteBtn: { en: "Delete", es: "Eliminar" },
  createBot: { en: "Create bot", es: "Crear bot" },
  namePlaceholder: { en: "Name", es: "Nombre" },
  descriptionPlaceholder: { en: "Description", es: "Descripción" },
  tagsPlaceholder: { en: "Tags (comma separated)", es: "Etiquetas (separadas por coma)" },
  refreshList: { en: "Refresh list", es: "Actualizar lista" },
  tableEmail: { en: "Email", es: "Correo" },
  tableRole: { en: "Role", es: "Rol" },
  tableMfa: { en: "MFA", es: "MFA" },
  toggleMfa: { en: "Toggle MFA", es: "Alternar MFA" },
  deleteUserAction: { en: "Delete", es: "Eliminar" },
  passwordPlaceholder: { en: "Password", es: "Contraseña" },
  roleUser: { en: "User", es: "Usuario" },
  roleAdmin: { en: "Admin", es: "Administrador" },
  removeSymbol: { en: "remove", es: "quitar" },
  pickerLoading: { en: "Loading available symbols…", es: "Cargando símbolos..." },
  chartLoading: { en: "Fetching latest candles…", es: "Obteniendo velas..." },
  marketDataError: {
    en: "Unable to reach market data API. Showing cached curve.",
    es: "No se pudo obtener datos de mercado. Mostrando curva en caché.",
  },
  tickerPlaceholder: { en: "Ticker", es: "Símbolo" },
  sectorPlaceholder: { en: "Sector", es: "Sector" },
  targetBot: { en: "Target bot", es: "Bot objetivo" },
  savePublish: { en: "Save & publish", es: "Guardar y publicar" },
  chartTitle: {
    en: "Market Overview",
    es: "Visión General del Mercado",
  },
  chartDesc: {
    en: "Real-time price feed for BTC-USD",
    es: "Precios en tiempo real para BTC-USD",
  },
  profileTitle: {
    en: "My Profile",
    es: "Mi Perfil",
  },
  landingHero: {
    en: "Algorithmic Trading for Everyone",
    es: "Trading Algorítmico para Todos",
  },
  landingSubhero: {
    en: "Build, backtest, and deploy automated trading strategies with ease. Connect to major exchanges and let your bots work for you 24/7.",
    es: "Construye, prueba y despliega estrategias automatizadas fácilmente. Conecta con los principales exchanges y deja que tus bots trabajen 24/7.",
  },
  landingCtaPrimary: { en: "Start Trading Free", es: "Empezar Gratis" },
  landingCtaSecondary: { en: "View Demo", es: "Ver Demo" },
  feature1Title: { en: "Visual Strategy Builder", es: "Constructor Visual" },
  feature1Desc: { en: "Create complex algorithms without writing code properly.", es: "Crea algoritmos complejos sin escribir código." },
  feature2Title: { en: "Real-time Signals", es: "Señales en Tiempo Real" },
  feature2Desc: { en: "Get instant alerts via WebSocket or Webhook when your strategy triggers.", es: "Recibe alertas instantáneas vía WebSocket o Webhook cuando tu estrategia se active." },
  feature3Title: { en: "Robust Backtesting", es: "Backtesting Robusto" },
  feature3Desc: { en: "Test your ideas against historical data with millisecond precision.", es: "Prueba tus ideas contra datos históricos con precisión de milisegundos." },
  navFeatures: { en: "Features", es: "Características" },
  navPricing: { en: "Pricing", es: "Precios" },
  navAbout: { en: "About", es: "Acerca de" },
  navSignIn: { en: "Sign In", es: "Iniciar Sesión" },
  navGetStarted: { en: "Get Started", es: "Empezar" },
  pricingTitle: { en: "Simple Pricing", es: "Precios Simples" },
  pricingSubtitle: { en: "Start small and scale as you grow. No hidden fees.", es: "Empieza pequeño y escala. Sin tarifas ocultas." },
  footerRights: { en: "Latino's Trading Platform. All rights reserved.", es: "Plataforma de Trading Latino's. Todos los derechos reservados." },
  
  // Authentication
  signInTitle: { en: "Sign in to your account", es: "Inicia sesión en tu cuenta" },
  welcomeBack: { en: "Welcome back, Trader.", es: "Bienvenido de nuevo, Trader." },
  signInEmailBtn: { en: "Sign in with Email", es: "Iniciar sesión con Email" },
  signingIn: { en: "Signing in...", es: "Iniciando sesión..." },
  orContinue: { en: "Or continue with", es: "O continúa con" },
  demoLogin: { en: "🚀 Demo Login (No Google Required)", es: "🚀 Login Demo (Sin Google)" },
  noAccount: { en: "Don't have an account?", es: "¿No tienes una cuenta?" },
  createAccountLink: { en: "Create account", es: "Crear cuenta" },
  createAccountTitle: { en: "Create your account", es: "Crea tu cuenta" },
  createAccountBtn: { en: "Create Account", es: "Crear Cuenta" },
  creatingAccount: { en: "Creating account...", es: "Creando cuenta..." },
  alreadyHaveAccount: { en: "Already have an account?", es: "¿Ya tienes cuenta?" },
  signInLink: { en: "Sign in", es: "Iniciar sesión" },
  nameLabel: { en: "Name", es: "Nombre" },
  emailLabel: { en: "Email", es: "Correo" },
  passwordLabel: { en: "Password", es: "Contraseña" },
  minChars: { en: "Minimum 6 characters", es: "Mínimo 6 caracteres" },
  authError: { en: "Something went wrong", es: "Algo salió mal" },
  invalidCredentials: { en: "Invalid email or password", es: "Email o contraseña inválidos" },
  
  // Signal Studio
  signalNamePlaceholder: { en: "Signal Name", es: "Nombre de la Señal" },
  mathFormula: { en: "Math Formula", es: "Fórmula Matemática" },
  pythonCode: { en: "Python Code", es: "Código Python" },
  updateSignal: { en: "Update Signal", es: "Actualizar Señal" },
  createSignal: { en: "Create Signal", es: "Crear Señal" },
  newSignal: { en: "New Signal", es: "Nueva Señal" },
  deleteSignal: { en: "Delete Signal", es: "Eliminar Señal" },
  signalSuccessUpdate: { en: "✅ Signal updated successfully!", es: "✅ ¡Señal actualizada con éxito!" },
  signalSuccessCreate: { en: "✅ Signal created successfully!", es: "✅ ¡Señal creada con éxito!" },
  signalError: { en: "Failed to save signal", es: "Error al guardar señal" },
  yourSignals: { en: "Your Signals", es: "Tus Señales" },
  signalLibrary: { en: "Signal Library", es: "Biblioteca de Señales" },
  manageSignalsDesc: { en: "Manage your trading signals.", es: "Administra tus señales de trading." },
  noSignalsYet: { en: "No signals yet.", es: "Aún no hay señales." },
  
  // Robot Studio
  robotStudioTitle: { en: "Robot Studio", es: "Estudio de Robots" },
  robotStudioDesc: { en: "Assemble signals into trading bots and backtest strategies.", es: "Ensambla señales en bots de trading y prueba estrategias." },
  availableSignals: { en: "Available Signals (Click to Add)", es: "Señales Disponibles (Clic para agregar)" },
  emptyStack: { en: "Empty stack. Add signals from top bar.", es: "Pila vacía. Agrega señales de la barra superior." },
  actionBuyShort: { en: "ACTION: BUY / SHORT", es: "ACCIÓN: COMPRAR / CORTO" },
  simulationTitle: { en: "Simulation & Training", es: "Simulación y Entrenamiento" },
  runSimulationBtn: { en: "▶️ Run Simulation", es: "▶️ Ejecutar Simulación" },
  runningSimulation: { en: "🚀 Running...", es: "🚀 Ejecutando..." },
  saveRobotTitle: { en: "Save as Robot", es: "Guardar como Robot" },
  saveBtn: { en: "💾 Save", es: "💾 Guardar" },
  saving: { en: "Saving...", es: "Guardando..." },
  myRobotsTitle: { en: "My Robots", es: "Mis Robots" },
  activeStatus: { en: "Active", es: "Activo" },
  pausedStatus: { en: "Paused", es: "Pausado" },
  legacyRobots: { en: "Legacy Script Robots", es: "Robots de Script Legacy" },
  step1Guide: { en: "Step 1: Add a Signal", es: "Paso 1: Agrega una Señal" },
  step2Guide: { en: "Step 2: Run Simulation", es: "Paso 2: Ejecuta Simulación" },
  robotNamePlaceholder: { en: "Enter robot name...", es: "Ingresa nombre del robot..." },
  signalStacks: { en: "Signal Stacks", es: "Pilas de Señales" },
  totalPnL: { en: "Total PnL", es: "PnL Total" },
  winRate: { en: "Win Rate", es: "Tasa de Acierto" },
  totalReturn: { en: "Total Return", es: "Retorno Total" },
  maxDrawdown: { en: "Max Drawdown", es: "Máximo Drawdown" },
  
  // Signal Feed
  robotRecommendation: { en: "Robot Recommendation", es: "Recomendación del Robot" },
  buyBtn: { en: "🛒 Buy", es: "🛒 Comprar" },
  sellBtn: { en: "💰 Sell", es: "💰 Vender" },
  simulatedOrderPlaced: { en: "Simulated order placed successfully!", es: "¡Orden simulada colocada con éxito!" },
  simulatedOrderFailed: { en: "Failed to place simulated trade.", es: "Falló la orden simulada." },
  noSignalsFound: { en: "No signals found yet.", es: "Aún no se encontraron señales." },
  
  // Navigation
  navLiveTrading: { en: "Live Trading", es: "Trading en Vivo" },
  navSignalStudio: { en: "Signals", es: "Señales" },
  navRobotStudio: { en: "Robots", es: "Robots" },
  
  // Editor
  editorTitle: { en: "Signal Library", es: "Biblioteca de Señales" },
  editorDescription: { en: "Manage your trading signals.", es: "Gestiona tus señales de trading." },
  askAI: { en: "Ask AI", es: "Preguntar a IA" },
  aiTitle: { en: "AI Assistant", es: "Asistente IA" },
  aiDesc: { en: "Describe your investment signal in plain language. The AI will generate the initial code for you.", es: "Describe tu señal de inversión en lenguaje natural. La IA generará el código inicial por ti." },
  aiModel: { en: "Model: Llama 3 (via local Ollama)", es: "Modelo: Llama 3 (vía Ollama local)" },
  aiPlaceholder: { en: "E.g. Buy when RSI < 30 and Sell when RSI > 70...", es: "Ej. Comprar cuando RSI < 30 y Vender cuando RSI > 70..." },
  cancel: { en: "Cancel", es: "Cancelar" },
  generateCode: { en: "Generate Code", es: "Generar Código" },
  generating: { en: "Generating...", es: "Generando..." },
  aiError: { en: "Error generating code.", es: "Error al generar el código." },
  
  // Dashboard / Live Trading
  activeRobots: { en: "Active Robots", es: "Robots Activos" },
  totalEquity: { en: "Total Balance", es: "Balance Total" },
  equity: { en: "Invested", es: "Invertido" },
  cash: { en: "Available", es: "Disponible" },
  viewDetails: { en: "View Details", es: "Ver Detalles" },
  recentActivity: { en: "Recent Activity", es: "Actividad Reciente" },
  noRecentTrades: { en: "No recent trades recorded.", es: "No hay operaciones recientes registradas." },
  
  // Common
  loading: { en: "Loading...", es: "Cargando..." },
  success: { en: "Success", es: "Éxito" },
  error: { en: "Error", es: "Error" },
  confirmDelete: { en: "Are you sure you want to delete this?", es: "¿Estás seguro de que quieres eliminar esto?" },
  
  // Dashboard Metrics & Charts
  performanceHistory: { en: "Performance History", es: "Historial de Rendimiento" },
  pnl: { en: "P&L", es: "P&L" },
  pnlAllTime: { en: "all time", es: "histórico" },
  readyToDeploy: { en: "Ready to deploy", es: "Listo para operar" },
  portfolioAllocation: { en: "of portfolio", es: "del portafolio" },
  
  // Dashboard Robot Cards
  recommendation: { en: "Recommendation", es: "Recomendación" },
  waitingForSignal: { en: "WAITING_FOR_SIGNAL...", es: "ESPERANDO_SEÑAL..." },
  signalEvent: { en: "Signal Event", es: "Evento de Señal" },
  unknownBot: { en: "Unknown Bot", es: "Bot Desconocido" },
  unknownSignal: { en: "Signal", es: "Señal" },

  // Transaction Log
  tableTime: { en: "Time", es: "Hora" },
  tableRobot: { en: "Robot", es: "Robot" },
  tableSignal: { en: "Signal", es: "Señal" },
  tableAction: { en: "Action", es: "Acción" },
  tablePrice: { en: "Price", es: "Precio" },
  
  // Stack Builder / Signal Studio
  searchSignalsPlaceholder: { en: "Search signals...", es: "Buscar señales..." },
  noMatchingSignals: { en: "No matching signals.", es: "No hay señales coincidentes." },
  flowSequential: { en: "FLOW: SEQUENTIAL (AND)", es: "FLUJO: SECUENCIAL (Y)" },
  marketData1D: { en: "MARKET DATA (1D)", es: "DATOS DE MERCADO (1D)" },
  capitalLabel: { en: "CAPITAL ($)", es: "CAPITAL ($)" },
  takeProfitLabel: { en: "TAKE PROFIT %", es: "TOMA DE GANANCIAS %" },
  stopLossLabel: { en: "STOP LOSS %", es: "STOP LOSS %" },
  historyBadge: { en: "History", es: "Historial" },
  resultsTitle: { en: "Results", es: "Resultados" },
  
  // Backtest Results Table
  tableHeaderDate: { en: "Date", es: "Fecha" },
  tableHeaderType: { en: "Type", es: "Tipo" },
  tableHeaderPrice: { en: "Price", es: "Precio" },
  tableHeaderPnL: { en: "PnL", es: "PnL" },
  tableHeaderBalance: { en: "Balance", es: "Balance" },
  
  // Stack Builder Validation
  enterRobotName: { en: "Please enter a robot name and add at least one signal.", es: "Ingresa un nombre para el robot y agrega al menos una señal." },
  robotSaved: { en: "Robot saved!", es: "¡Robot guardado!" },
  addSignalsParams: { en: "Add signals before running simulation.", es: "Agrega señales antes de simular." },
  addSignalStack: { en: "Please add at least one signal to the stack.", es: "Agrega al menos una señal a la pila." },
  backtestFailed: { en: "Backtest failed", es: "Falló el backtest" },
} as const;

export type TranslationKey = keyof typeof translations;

export function getTranslation(key: TranslationKey, language: Language, fallback: string): string {
  return translations[key]?.[language] ?? fallback;
}
