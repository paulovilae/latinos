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
  navSignals: { en: "Signals", es: "Señales" },
  navSignalsPage: { en: "Signal Studio", es: "Estudio de Señales" },
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
  signalsTitle: { en: "Signals", es: "Señales" },
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
} as const;

export type TranslationKey = keyof typeof translations;

export function getTranslation(key: TranslationKey, language: Language, fallback: string): string {
  return translations[key]?.[language] ?? fallback;
}
