import React, { useEffect, useMemo, useState } from 'react'
import {
  AlertTriangle,
  Download,
  Euro,
  LineChart,
  PiggyBank,
  RotateCcw,
  Save,
  Smartphone,
  Sparkles,
  TrendingUp,
  Upload,
  Wallet,
  Plus,
  Trash2,
} from 'lucide-react'
import {
  ResponsiveContainer,
  LineChart as ReLineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  BarChart,
  Bar,
} from 'recharts'

const STORAGE_KEY = 'control-de-gastos-iphone-v1'
const APP_NAME = 'CONTROL DE GASTOS'

const eur = new Intl.NumberFormat('es-ES', {
  style: 'currency',
  currency: 'EUR',
  maximumFractionDigits: 2,
})

const defaultData = {
  salary1: 950,
  salary2: 700,
  rewardIncome: 20,
  interestIncome: 12,
  targetSavingPct: 20,
  fixedExpenses: [
    { id: 1, name: 'ChatGPT Plus', amount: 20 },
    { id: 2, name: 'Club deportivo', amount: 35 },
  ],
  investments: [
    { id: 1, name: 'S&P 500', amount: 150 },
    { id: 2, name: 'Oro', amount: 50 },
    { id: 3, name: 'ACWI', amount: 100 },
  ],
  variableExpenses: [
    { id: 1, name: 'Supermercado', amount: 220, category: 'Hogar' },
    { id: 2, name: 'Gasolina / transporte', amount: 120, category: 'Transporte' },
    { id: 3, name: 'Comidas fuera', amount: 110, category: 'Ocio' },
  ],
const defaultData = {
  ...
  monthlyHistory: [
    {
      id: 1,
      month: "Enero",
      ...
    },
    {
      id: 2,
      month: "Febrero",
      ...
    },
    {
      id: 3,
      month: "Marzo",
      ...
    }
  ]
}

function loadInitialData() {
  if (typeof window === 'undefined') return defaultData
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY)
    if (!raw) return defaultData
    const parsed = JSON.parse(raw)
    return { ...defaultData, ...parsed }
  } catch {
    return defaultData
  }
}

function downloadBackup(data) {
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = 'control-gastos-backup.json'
  link.click()
  URL.revokeObjectURL(url)
}

function Card({ title, icon, children, subtitle }) {
  return (
    <section style={styles.card}>
      {(title || subtitle) && (
        <div style={styles.cardHeader}>
          <div style={styles.cardTitleWrap}>
            {icon}
            <div>
              {title && <h3 style={styles.cardTitle}>{title}</h3>}
              {subtitle && <p style={styles.cardSubtitle}>{subtitle}</p>}
            </div>
          </div>
        </div>
      )}
      <div>{children}</div>
    </section>
  )
}

function NumberField({ label, value, onChange, placeholder = '0' }) {
  return (
    <div style={styles.fieldWrap}>
      <label style={styles.label}>{label}</label>
      <input
        style={styles.input}
        type="number"
        min="0"
        step="0.01"
        value={value}
        placeholder={placeholder}
        onChange={(e) => onChange(Number(e.target.value) || 0)}
      />
    </div>
  )
}

function TextField({ label, value, onChange, placeholder = '' }) {
  return (
    <div style={styles.fieldWrap}>
      <label style={styles.label}>{label}</label>
      <input
        style={styles.input}
        type="text"
        value={value}
        placeholder={placeholder}
        onChange={(e) => onChange(e.target.value)}
      />
    </div>
  )
}

function ActionButton({ children, onClick, type = 'button', ghost = false }) {
  return (
    <button type={type} onClick={onClick} style={{ ...styles.button, ...(ghost ? styles.buttonGhost : {}) }}>
      {children}
    </button>
  )
}

function SectionList({ title, items, setItems, extraField = false }) {
  const [name, setName] = useState('')
  const [amount, setAmount] = useState(0)
  const [category, setCategory] = useState('')

  const addItem = () => {
    if (!name || amount <= 0) return
    setItems([
      ...items,
      { id: Date.now(), name, amount, ...(extraField ? { category: category || 'Otros' } : {}) },
    ])
    setName('')
    setAmount(0)
    setCategory('')
  }

  const removeItem = (id) => setItems(items.filter((item) => item.id !== id))

  return (
    <Card title={title}>
      <div className="form-grid" style={styles.formGrid}>
        <TextField label="Concepto" value={name} onChange={setName} placeholder="Ej. Netflix" />
        {extraField && <TextField label="Categoría" value={category} onChange={setCategory} placeholder="Ej. Ocio" />}
        <NumberField label="Importe" value={amount} onChange={setAmount} />
      </div>
      <div style={{ marginTop: 12 }}>
        <ActionButton onClick={addItem}>
          <span style={styles.buttonInline}><Plus size={16} /> Añadir</span>
        </ActionButton>
      </div>

      <div style={{ marginTop: 16, display: 'grid', gap: 10 }}>
        {items.length === 0 ? <p style={styles.muted}>No hay elementos todavía.</p> : null}
        {items.map((item) => (
          <div key={item.id} style={styles.listItem}>
            <div style={{ minWidth: 0 }}>
              <div style={styles.listItemTitle}>{item.name}</div>
              {extraField ? <div style={styles.listItemSub}>{item.category}</div> : null}
            </div>
            <div style={styles.listItemRight}>
              <strong>{eur.format(item.amount)}</strong>
              <button onClick={() => removeItem(item.id)} style={styles.iconButton} aria-label="Eliminar">
                <Trash2 size={16} />
              </button>
            </div>
          </div>
        ))}
      </div>
    </Card>
  )
}

function HistoryTable({ history }) {
  const allCategories = Array.from(new Set(history.flatMap((m) => Object.keys(m.categories || {}))))

  return (
    <div style={styles.tableWrap}>
      <table style={styles.table}>
        <thead>
          <tr>
            <th style={styles.th}>Mes</th>
            <th style={styles.th}>Ingresos</th>
            <th style={styles.th}>Ahorro</th>
            {allCategories.map((category) => (
              <th key={category} style={styles.th}>{category}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {history.map((row) => (
            <tr key={row.id}>
              <td style={styles.tdStrong}>{row.month}</td>
              <td style={styles.td}>{eur.format(row.income)}</td>
              <td style={{ ...styles.td, color: row.saving < 0 ? '#dc2626' : '#15803d', fontWeight: 700 }}>{eur.format(row.saving)}</td>
              {allCategories.map((category) => (
                <td key={category} style={styles.td}>{eur.format(row.categories?.[category] || 0)}</td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

function ProgressBar({ value }) {
  const safe = Math.max(0, Math.min(value, 100))
  return (
    <div style={styles.progressTrack}>
      <div style={{ ...styles.progressFill, width: `${safe}%` }} />
    </div>
  )
}

function StatCard({ title, value, icon, valueColor }) {
  return (
    <Card>
      <div style={styles.statRow}>
        <div>
          <div style={styles.statLabel}>{title}</div>
          <div style={{ ...styles.statValue, color: valueColor || '#0f172a' }}>{value}</div>
        </div>
        <div style={styles.statIcon}>{icon}</div>
      </div>
    </Card>
  )
}

export default function App() {
  const initial = loadInitialData()

  const [salary1, setSalary1] = useState(initial.salary1)
  const [salary2, setSalary2] = useState(initial.salary2)
  const [rewardIncome, setRewardIncome] = useState(initial.rewardIncome)
  const [interestIncome, setInterestIncome] = useState(initial.interestIncome)
  const [targetSavingPct, setTargetSavingPct] = useState(initial.targetSavingPct)
  const [fixedExpenses, setFixedExpenses] = useState(initial.fixedExpenses)
  const [investments, setInvestments] = useState(initial.investments)
  const [variableExpenses, setVariableExpenses] = useState(initial.variableExpenses)
  const [monthlyHistory, setMonthlyHistory] = useState(initial.monthlyHistory)

  const [simVariableCut, setSimVariableCut] = useState(50)
  const [simInvestmentCut, setSimInvestmentCut] = useState(30)
  const [historyMonth, setHistoryMonth] = useState('')
  const [historyIncome, setHistoryIncome] = useState(0)
  const [historySaving, setHistorySaving] = useState(0)
  const [historyCategoryText, setHistoryCategoryText] = useState('Hogar:220, Transporte:120, Ocio:140, Otros:50')
  const [saveMessage, setSaveMessage] = useState('')
  const [importMessage, setImportMessage] = useState('')
  const [activeTab, setActiveTab] = useState('fixed')

  useEffect(() => {
    const dataToSave = {
      salary1,
      salary2,
      rewardIncome,
      interestIncome,
      targetSavingPct,
      fixedExpenses,
      investments,
      variableExpenses,
      monthlyHistory,
    }
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(dataToSave))
    setSaveMessage('Datos guardados en este iPhone')
    const timer = window.setTimeout(() => setSaveMessage(''), 1500)
    return () => window.clearTimeout(timer)
  }, [salary1, salary2, rewardIncome, interestIncome, targetSavingPct, fixedExpenses, investments, variableExpenses, monthlyHistory])

  const totalIncome = useMemo(() => salary1 + salary2 + rewardIncome + interestIncome, [salary1, salary2, rewardIncome, interestIncome])
  const totalFixed = useMemo(() => fixedExpenses.reduce((sum, item) => sum + item.amount, 0), [fixedExpenses])
  const totalInvestments = useMemo(() => investments.reduce((sum, item) => sum + item.amount, 0), [investments])
  const totalVariable = useMemo(() => variableExpenses.reduce((sum, item) => sum + item.amount, 0), [variableExpenses])

  const totalExpenses = totalFixed + totalInvestments + totalVariable
  const currentSaving = totalIncome - totalExpenses
  const savingRate = totalIncome > 0 ? (currentSaving / totalIncome) * 100 : 0
  const targetSaving = totalIncome * (targetSavingPct / 100)
  const missingToTarget = Math.max(targetSaving - currentSaving, 0)

  const categoryBreakdown = useMemo(() => {
    const map = {}
    variableExpenses.forEach((item) => {
      map[item.category] = (map[item.category] || 0) + item.amount
    })
    return Object.entries(map)
      .map(([category, amount]) => ({
        category,
        amount,
        pctVariable: totalVariable > 0 ? (amount / totalVariable) * 100 : 0,
        pctIncome: totalIncome > 0 ? (amount / totalIncome) * 100 : 0,
      }))
      .sort((a, b) => b.amount - a.amount)
  }, [variableExpenses, totalVariable, totalIncome])

  const averageSaving = useMemo(() => {
    if (!monthlyHistory.length) return 0
    return monthlyHistory.reduce((acc, item) => acc + item.saving, 0) / monthlyHistory.length
  }, [monthlyHistory])

  const averageIncome = useMemo(() => {
    if (!monthlyHistory.length) return 0
    return monthlyHistory.reduce((acc, item) => acc + item.income, 0) / monthlyHistory.length
  }, [monthlyHistory])

  const allHistoryCategories = useMemo(
    () => Array.from(new Set(monthlyHistory.flatMap((item) => Object.keys(item.categories || {})))),
    [monthlyHistory]
  )

  const categoryMonthlyAverages = useMemo(() => {
    return allHistoryCategories
      .map((category) => {
        const total = monthlyHistory.reduce((sum, month) => sum + (month.categories?.[category] || 0), 0)
        return { category, amount: monthlyHistory.length ? total / monthlyHistory.length : 0 }
      })
      .sort((a, b) => b.amount - a.amount)
  }, [allHistoryCategories, monthlyHistory])

  const topLeak = categoryBreakdown[0]
  const worstHistoricalCategory = categoryMonthlyAverages[0]
  const investmentRate = totalIncome > 0 ? (totalInvestments / totalIncome) * 100 : 0

  const diagnosis = useMemo(() => {
    if (savingRate < 0) {
      return {
        title: 'Estás en ahorro negativo',
        text: 'Tus gastos e inversión superan tus ingresos mensuales. Necesitas recortar gasto variable o reducir temporalmente inversión para recuperar margen.',
      }
    }
    if (savingRate < 10) {
      return {
        title: 'Tu ahorro es demasiado bajo',
        text: 'Estás guardando poco margen al mes. El problema probablemente está en el gasto variable o en una aportación de inversión demasiado exigente para tu liquidez actual.',
      }
    }
    if (savingRate < targetSavingPct) {
      return {
        title: 'Vas por debajo de tu objetivo',
        text: 'Tu estructura financiera es estable, pero todavía no llegas a la tasa de ahorro que quieres. Hay margen de ajuste fino.',
      }
    }
    return {
      title: 'Buen equilibrio mensual',
      text: 'Tu ahorro actual está alineado o por encima del objetivo marcado. Ahora lo importante es mantener consistencia y controlar fugas pequeñas.',
    }
  }, [savingRate, targetSavingPct])

  const investmentMessage =
    investmentRate > 25
      ? 'Tu nivel de inversión puede estar limitando tu liquidez mensual.'
      : investmentRate >= 10
        ? 'Tu nivel de inversión es razonable para construir patrimonio sin perder demasiado margen.'
        : 'Tu nivel de inversión es conservador y deja más liquidez libre.'

  const simulatedSaving = currentSaving + simVariableCut + simInvestmentCut
  const simulatedSavingRate = totalIncome > 0 ? (simulatedSaving / totalIncome) * 100 : 0

  const historyLineData = monthlyHistory.map((item) => ({ month: item.month, ingresos: item.income, ahorro: item.saving }))
  const categoryChartData = monthlyHistory.map((item) => {
    const row = { month: item.month }
    allHistoryCategories.forEach((category) => {
      row[category] = item.categories?.[category] || 0
    })
    return row
  })

  const addHistoryMonth = () => {
    if (!historyMonth) return
    const parsedCategories = historyCategoryText
      .split(',')
      .map((chunk) => chunk.trim())
      .filter(Boolean)
      .reduce((acc, item) => {
        const [key, value] = item.split(':')
        if (key && value) acc[key.trim()] = Number(value.trim()) || 0
        return acc
      }, {})

    setMonthlyHistory([
      ...monthlyHistory,
      { id: Date.now(), month: historyMonth, income: historyIncome, saving: historySaving, categories: parsedCategories },
    ])

    setHistoryMonth('')
    setHistoryIncome(0)
    setHistorySaving(0)
    setHistoryCategoryText('Hogar:220, Transporte:120, Ocio:140, Otros:50')
  }

  const resetAllData = () => {
    setSalary1(defaultData.salary1)
    setSalary2(defaultData.salary2)
    setRewardIncome(defaultData.rewardIncome)
    setInterestIncome(defaultData.interestIncome)
    setTargetSavingPct(defaultData.targetSavingPct)
    setFixedExpenses(defaultData.fixedExpenses)
    setInvestments(defaultData.investments)
    setVariableExpenses(defaultData.variableExpenses)
    setMonthlyHistory(defaultData.monthlyHistory)
    window.localStorage.removeItem(STORAGE_KEY)
    setSaveMessage('Datos reiniciados')
  }

  const exportData = () => {
    downloadBackup({ salary1, salary2, rewardIncome, interestIncome, targetSavingPct, fixedExpenses, investments, variableExpenses, monthlyHistory })
    setSaveMessage('Copia exportada')
  }

  const importData = (event) => {
    const file = event.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = (e) => {
      try {
        const parsed = JSON.parse(String(e.target?.result || '{}'))
        setSalary1(parsed.salary1 ?? defaultData.salary1)
        setSalary2(parsed.salary2 ?? defaultData.salary2)
        setRewardIncome(parsed.rewardIncome ?? defaultData.rewardIncome)
        setInterestIncome(parsed.interestIncome ?? defaultData.interestIncome)
        setTargetSavingPct(parsed.targetSavingPct ?? defaultData.targetSavingPct)
        setFixedExpenses(parsed.fixedExpenses ?? defaultData.fixedExpenses)
        setInvestments(parsed.investments ?? defaultData.investments)
        setVariableExpenses(parsed.variableExpenses ?? defaultData.variableExpenses)
        setMonthlyHistory(parsed.monthlyHistory ?? defaultData.monthlyHistory)
        setImportMessage('Copia importada correctamente')
      } catch {
        setImportMessage('No se pudo importar el archivo')
      }
    }
    reader.readAsText(file)
    event.target.value = ''
  }

  return (
    <div style={styles.page}>
      <div style={styles.container}>
        <header style={styles.hero}>
          <div>
            <div style={styles.badge}>Versión lista para iPhone</div>
            <h1 style={styles.title}>{APP_NAME}</h1>
            <p style={styles.subtitle}>
              Web personal para controlar ingresos, gastos, inversión y ahorro mensual. Pensada para abrirla en tu iPhone y añadirla a la pantalla de inicio.
            </p>
          </div>
          <div style={styles.headerActionsWrap}>
            {saveMessage ? <span style={styles.smallMessage}>{saveMessage}</span> : null}
            {importMessage ? <span style={styles.smallMessage}>{importMessage}</span> : null}
            <div className="header-actions" style={styles.headerActions}>
              <ActionButton onClick={resetAllData} ghost>
                <span style={styles.buttonInline}><RotateCcw size={16} /> Reiniciar</span>
              </ActionButton>
              <ActionButton onClick={exportData} ghost>
                <span style={styles.buttonInline}><Download size={16} /> Exportar</span>
              </ActionButton>
              <label style={{ ...styles.button, ...styles.buttonGhost, cursor: 'pointer' }}>
                <span style={styles.buttonInline}><Upload size={16} /> Importar</span>
                <input type="file" accept="application/json" onChange={importData} style={{ display: 'none' }} />
              </label>
              <ActionButton>
                <span style={styles.buttonInline}><Save size={16} /> Guardado local</span>
              </ActionButton>
            </div>
          </div>
        </header>

        <div className="stats-grid" style={styles.statsGrid}>
          <StatCard title="Ingresos mensuales" value={eur.format(totalIncome)} icon={<Wallet size={26} />} />
          <StatCard title="Gastos totales" value={eur.format(totalExpenses)} icon={<Euro size={26} />} />
          <StatCard title="Ahorro estimado" value={eur.format(currentSaving)} valueColor={currentSaving < 0 ? '#dc2626' : '#15803d'} icon={<PiggyBank size={26} />} />
          <StatCard title="Tasa de ahorro" value={`${savingRate.toFixed(1)}%`} icon={<TrendingUp size={26} />} />
        </div>

        <div className="main-grid" style={styles.mainGrid}>
          <Card title="Resumen del mes">
            <div style={styles.formGridSingle}>
              <NumberField label="Nómina 1" value={salary1} onChange={setSalary1} />
              <NumberField label="Nómina 2" value={salary2} onChange={setSalary2} />
              <NumberField label="Recompensa / cashback / reinversión" value={rewardIncome} onChange={setRewardIncome} />
              <NumberField label="Intereses cuenta remunerada" value={interestIncome} onChange={setInterestIncome} />
              <NumberField label="Objetivo de ahorro (%)" value={targetSavingPct} onChange={setTargetSavingPct} />
            </div>

            <div style={styles.infoBox}>
              <div style={styles.rowBetween}><span>Objetivo ahorro</span><strong>{eur.format(targetSaving)}</strong></div>
              <div style={styles.rowBetween}><span>Te falta para llegar</span><strong>{eur.format(missingToTarget)}</strong></div>
              <ProgressBar value={(currentSaving / Math.max(targetSaving, 1)) * 100} />
            </div>

            <div style={styles.infoBox}>
              <div style={styles.rowBetween}><span>Gastos fijos</span><strong>{eur.format(totalFixed)}</strong></div>
              <div style={styles.rowBetween}><span>Inversión mensual</span><strong>{eur.format(totalInvestments)}</strong></div>
              <div style={styles.rowBetween}><span>Gasto variable</span><strong>{eur.format(totalVariable)}</strong></div>
              <div style={{ ...styles.rowBetween, borderTop: '1px solid #e2e8f0', paddingTop: 10 }}><span>Total gastos</span><strong>{eur.format(totalExpenses)}</strong></div>
            </div>
          </Card>

          <div>
            <div className="tabs-row" style={styles.tabsRow}>
              {[
                ['fixed', 'Gastos fijos'],
                ['variable', 'Gastos variables'],
                ['investments', 'Inversiones'],
              ].map(([key, label]) => (
                <button
                  key={key}
                  onClick={() => setActiveTab(key)}
                  style={{ ...styles.tabButton, ...(activeTab === key ? styles.tabButtonActive : {}) }}
                >
                  {label}
                </button>
              ))}
            </div>
            {activeTab === 'fixed' && <SectionList title="Tus gastos fijos mensuales" items={fixedExpenses} setItems={setFixedExpenses} />}
            {activeTab === 'variable' && <SectionList title="Tus gastos variables" items={variableExpenses} setItems={setVariableExpenses} extraField />}
            {activeTab === 'investments' && <SectionList title="Tus aportaciones mensuales" items={investments} setItems={setInvestments} />}
          </div>
        </div>

        <div className="two-col-grid" style={styles.twoColGrid}>
          <Card title="Diagnóstico automático" icon={<AlertTriangle size={18} color="#f59e0b" />}>
            <div style={styles.infoBox}><strong>{diagnosis.title}</strong><p style={styles.paragraph}>{diagnosis.text}</p></div>
            <div style={styles.infoBox}><strong>Peso de la inversión</strong><p style={styles.paragraph}>Estás destinando {investmentRate.toFixed(1)}% de tus ingresos mensuales a inversión. {investmentMessage}</p></div>
            <div style={styles.infoBox}><strong>Principal fuga actual</strong><p style={styles.paragraph}>{topLeak ? `${topLeak.category} es tu mayor gasto variable con ${eur.format(topLeak.amount)}, equivalente al ${topLeak.pctIncome.toFixed(1)}% de tus ingresos mensuales.` : 'Todavía no hay suficientes gastos variables cargados.'}</p></div>
            <div style={styles.infoBox}><strong>Promedio de ahorro histórico</strong><p style={styles.paragraph}>Tu ahorro medio registrado es de {eur.format(averageSaving)} al mes sobre unos ingresos medios de {eur.format(averageIncome)}.</p></div>
          </Card>

          <Card title="Simulador rápido" icon={<Sparkles size={18} color="#16a34a" />}>
            <NumberField label="Reducir gasto variable (€)" value={simVariableCut} onChange={setSimVariableCut} />
            <NumberField label="Reducir inversión temporalmente (€)" value={simInvestmentCut} onChange={setSimInvestmentCut} />
            <div style={styles.infoBox}>
              <div style={styles.rowBetween}><span>Ahorro actual</span><strong>{eur.format(currentSaving)}</strong></div>
              <div style={styles.rowBetween}><span>Ahorro simulado</span><strong style={{ color: '#15803d' }}>{eur.format(simulatedSaving)}</strong></div>
              <div style={styles.rowBetween}><span>Nueva tasa de ahorro</span><strong>{simulatedSavingRate.toFixed(1)}%</strong></div>
            </div>
            <div style={styles.infoBox}>Reduciendo {eur.format(simVariableCut)} de gasto variable y {eur.format(simInvestmentCut)} de inversión, mejorarías tu ahorro mensual en {eur.format(simVariableCut + simInvestmentCut)}.</div>
          </Card>
        </div>

        <div className="two-col-grid" style={styles.twoColGrid}>
          <Card title="¿Dónde se te va el dinero ahora?">
            <div style={{ display: 'grid', gap: 12 }}>
              {categoryBreakdown.length === 0 ? <p style={styles.muted}>Añade gastos variables para ver categorías.</p> : null}
              {categoryBreakdown.map((item) => (
                <div key={item.category} style={styles.infoBox}>
                  <div style={styles.rowBetween}><strong>{item.category}</strong><span>{eur.format(item.amount)}</span></div>
                  <div className="mini-meta" style={styles.miniMeta}><span>{item.pctVariable.toFixed(1)}% del gasto variable</span><span>{item.pctIncome.toFixed(1)}% de tus ingresos</span></div>
                  <ProgressBar value={item.pctVariable} />
                </div>
              ))}
            </div>
          </Card>

          <Card title="Lectura rápida">
            <div style={styles.infoBox}><strong>Mayor categoría histórica</strong><p style={styles.paragraph}>{worstHistoricalCategory ? `En tu histórico, la categoría con mayor media mensual es ${worstHistoricalCategory.category}, con ${eur.format(worstHistoricalCategory.amount)} al mes.` : 'Todavía no hay histórico suficiente.'}</p></div>
            <div style={styles.infoBox}><strong>Margen disponible real</strong><p style={styles.paragraph}>Después de gastos e inversión, te quedan {eur.format(currentSaving)} al mes. Ese es tu margen real para ahorrar, reforzar liquidez o ajustar inversión.</p></div>
            <div style={styles.infoBox}><strong>Qué mirar primero</strong><p style={styles.paragraph}>Empieza observando si una sola categoría crece varios meses seguidos. Ahí suele estar la fuga real, más que en los gastos fijos.</p></div>
          </Card>
        </div>

        <div className="main-grid" style={styles.mainGrid}>
          <Card title="Añadir mes al histórico" icon={<LineChart size={18} color="#2563eb" />}>
            <TextField label="Mes" value={historyMonth} onChange={setHistoryMonth} placeholder="Ej. Abril 2026" />
            <NumberField label="Ingresos del mes" value={historyIncome} onChange={setHistoryIncome} />
            <NumberField label="Ahorro del mes" value={historySaving} onChange={setHistorySaving} />
            <TextField label="Gasto por categoría" value={historyCategoryText} onChange={setHistoryCategoryText} placeholder="Hogar:220, Transporte:120, Ocio:140" />
            <p style={styles.muted}>Formato: Categoría:importe, separado por comas.</p>
            <ActionButton onClick={addHistoryMonth}>Guardar mes</ActionButton>
          </Card>

          <Card title="Histórico mes a mes">
            <HistoryTable history={monthlyHistory} />
          </Card>
        </div>

        <div className="two-col-grid" style={styles.twoColGrid}>
          <Card title="Evolución de ingresos y ahorro">
            <div style={styles.chartWrap}>
              <ResponsiveContainer width="100%" height="100%">
                <ReLineChart data={historyLineData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis />
                  <Tooltip formatter={(value) => eur.format(Number(value))} />
                  <Legend />
                  <Line type="monotone" dataKey="ingresos" stroke="#0f766e" strokeWidth={3} dot={{ r: 3 }} />
                  <Line type="monotone" dataKey="ahorro" stroke="#16a34a" strokeWidth={3} dot={{ r: 3 }} />
                </ReLineChart>
              </ResponsiveContainer>
            </div>
          </Card>

          <Card title="Gasto por categoría mes a mes">
            <div style={styles.chartWrap}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={categoryChartData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis />
                  <Tooltip formatter={(value) => eur.format(Number(value))} />
                  <Legend />
                  {allHistoryCategories.map((category, index) => (
                    <Bar key={category} dataKey={category} stackId="a" fill={BAR_COLORS[index % BAR_COLORS.length]} />
                  ))}
                </BarChart>
              </ResponsiveContainer>
            </div>
          </Card>
        </div>

        <Card title="Lista para usar en iPhone" icon={<Smartphone size={18} color="#2563eb" />}>
          <div className="install-grid" style={styles.installGrid}>
            <div style={styles.infoBox}><strong>Cómo usarla como si fuera una app</strong><p style={styles.paragraph}>1. Abre la web en Safari. 2. Pulsa compartir. 3. Elige “Añadir a pantalla de inicio”. 4. Verás el icono de {APP_NAME} en tu iPhone.</p></div>
            <div style={styles.infoBox}><strong>Qué ya hace esta versión</strong><p style={styles.paragraph}>Guarda tus datos en el navegador del iPhone, exporta copia JSON e importa esa copia si cambias de móvil o borras datos.</p></div>
            <div style={styles.infoBox}><strong>Qué ya tienes resuelto</strong><p style={styles.paragraph}>No necesitas App Store ni cuenta de desarrollador de Apple. Solo publicar en Vercel y abrir la URL desde Safari.</p></div>
          </div>
        </Card>
      </div>
    </div>
  )
}

const BAR_COLORS = ['#16a34a', '#0ea5e9', '#f59e0b', '#8b5cf6', '#ef4444', '#14b8a6']

const styles = {
  page: {
    minHeight: '100vh',
    background: 'linear-gradient(180deg, #f8fafc 0%, #eefbf3 100%)',
    padding: '18px 14px 40px',
  },
  container: {
    width: '100%',
    maxWidth: 1240,
    margin: '0 auto',
    display: 'grid',
    gap: 18,
  },
  hero: {
    display: 'grid',
    gap: 14,
    background: '#ffffff',
    borderRadius: 24,
    padding: 20,
    boxShadow: '0 10px 30px rgba(15, 23, 42, 0.06)',
    border: '1px solid #e2e8f0',
  },
  badge: {
    display: 'inline-flex',
    background: '#dcfce7',
    color: '#166534',
    borderRadius: 999,
    padding: '6px 10px',
    fontSize: 12,
    fontWeight: 700,
    marginBottom: 8,
  },
  title: {
    margin: '0 0 8px',
    fontSize: 'clamp(1.8rem, 4vw, 2.8rem)',
    lineHeight: 1.05,
  },
  subtitle: {
    margin: 0,
    color: '#475569',
    lineHeight: 1.5,
    maxWidth: 820,
  },
  headerActionsWrap: {
    display: 'grid',
    gap: 8,
  },
  smallMessage: {
    color: '#64748b',
    fontSize: 12,
  },
  headerActions: {
    display: 'flex',
    gap: 10,
    flexWrap: 'wrap',
  },
  statsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
    gap: 14,
  },
  statRow: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 16,
  },
  statLabel: {
    color: '#64748b',
    fontSize: 14,
    marginBottom: 8,
  },
  statValue: {
    fontSize: 30,
    fontWeight: 800,
    lineHeight: 1,
  },
  statIcon: {
    color: '#166534',
    width: 46,
    height: 46,
    display: 'grid',
    placeItems: 'center',
    borderRadius: 14,
    background: '#dcfce7',
  },
  mainGrid: {
    display: 'grid',
    gridTemplateColumns: '1.1fr 1.4fr',
    gap: 18,
  },
  twoColGrid: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: 18,
  },
  card: {
    background: '#ffffff',
    borderRadius: 24,
    padding: 18,
    boxShadow: '0 10px 30px rgba(15, 23, 42, 0.06)',
    border: '1px solid #e2e8f0',
  },
  cardHeader: {
    marginBottom: 12,
  },
  cardTitleWrap: {
    display: 'flex',
    alignItems: 'center',
    gap: 10,
  },
  cardTitle: {
    margin: 0,
    fontSize: 18,
  },
  cardSubtitle: {
    margin: 0,
    fontSize: 13,
    color: '#64748b',
  },
  fieldWrap: {
    display: 'grid',
    gap: 6,
    marginBottom: 12,
  },
  label: {
    fontSize: 13,
    fontWeight: 600,
    color: '#334155',
  },
  input: {
    width: '100%',
    borderRadius: 14,
    border: '1px solid #cbd5e1',
    padding: '12px 14px',
    outline: 'none',
    background: '#fff',
  },
  button: {
    border: 'none',
    background: '#166534',
    color: '#fff',
    borderRadius: 16,
    padding: '12px 16px',
    fontWeight: 700,
    cursor: 'pointer',
  },
  buttonGhost: {
    background: '#fff',
    color: '#0f172a',
    border: '1px solid #cbd5e1',
  },
  buttonInline: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: 8,
  },
  formGrid: {
    display: 'grid',
    gridTemplateColumns: '2fr 1fr 1fr',
    gap: 12,
  },
  formGridSingle: {
    display: 'grid',
    gridTemplateColumns: '1fr',
    gap: 0,
  },
  listItem: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 12,
    padding: 12,
    borderRadius: 18,
    border: '1px solid #e2e8f0',
    background: '#fff',
  },
  listItemTitle: {
    fontWeight: 700,
    wordBreak: 'break-word',
  },
  listItemSub: {
    fontSize: 13,
    color: '#64748b',
    marginTop: 4,
  },
  listItemRight: {
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    flexShrink: 0,
  },
  iconButton: {
    width: 34,
    height: 34,
    borderRadius: 10,
    border: '1px solid #e2e8f0',
    background: '#fff',
    cursor: 'pointer',
    display: 'grid',
    placeItems: 'center',
  },
  infoBox: {
    marginTop: 12,
    border: '1px solid #e2e8f0',
    borderRadius: 18,
    padding: 14,
    background: '#fff',
  },
  rowBetween: {
    display: 'flex',
    justifyContent: 'space-between',
    gap: 10,
    alignItems: 'center',
    fontSize: 14,
    marginBottom: 8,
  },
  paragraph: {
    margin: '8px 0 0',
    color: '#475569',
    lineHeight: 1.5,
  },
  muted: {
    margin: 0,
    color: '#64748b',
    fontSize: 13,
  },
  progressTrack: {
    width: '100%',
    height: 10,
    borderRadius: 999,
    background: '#e2e8f0',
    overflow: 'hidden',
    marginTop: 8,
  },
  progressFill: {
    height: '100%',
    background: 'linear-gradient(90deg, #16a34a, #22c55e)',
    borderRadius: 999,
  },
  tabsRow: {
    display: 'grid',
    gridTemplateColumns: 'repeat(3, 1fr)',
    gap: 8,
    marginBottom: 12,
  },
  tabButton: {
    border: '1px solid #cbd5e1',
    background: '#fff',
    color: '#0f172a',
    borderRadius: 14,
    padding: '12px 10px',
    fontWeight: 700,
    cursor: 'pointer',
  },
  tabButtonActive: {
    background: '#166534',
    color: '#fff',
    borderColor: '#166534',
  },
  tableWrap: {
    overflowX: 'auto',
    border: '1px solid #e2e8f0',
    borderRadius: 18,
  },
  table: {
    width: '100%',
    minWidth: 680,
    borderCollapse: 'collapse',
    fontSize: 14,
  },
  th: {
    textAlign: 'left',
    background: '#f8fafc',
    padding: 12,
    borderBottom: '1px solid #e2e8f0',
  },
  td: {
    padding: 12,
    borderBottom: '1px solid #e2e8f0',
  },
  tdStrong: {
    padding: 12,
    borderBottom: '1px solid #e2e8f0',
    fontWeight: 700,
  },
  miniMeta: {
    display: 'flex',
    justifyContent: 'space-between',
    gap: 8,
    color: '#64748b',
    fontSize: 12,
    marginBottom: 8,
    marginTop: 4,
  },
  chartWrap: {
    width: '100%',
    height: 300,
  },
  installGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
    gap: 12,
  },
}

const media = `
@media (max-width: 980px) {
  .responsive-main-grid,
  .responsive-two-col {
    grid-template-columns: 1fr !important;
  }
}
`

if (typeof document !== 'undefined' && !document.getElementById('app-inline-media')) {
  const style = document.createElement('style')
  style.id = 'app-inline-media'
  style.innerHTML = `
    @media (max-width: 980px) {
      .main-grid, .two-col-grid { grid-template-columns: 1fr !important; }
    }
    @media (max-width: 760px) {
      .form-grid { grid-template-columns: 1fr !important; }
      .tabs-row { grid-template-columns: 1fr !important; }
      .header-actions { flex-direction: column; }
      .mini-meta { flex-direction: column; }
    }
  `
  document.head.appendChild(style)
}
