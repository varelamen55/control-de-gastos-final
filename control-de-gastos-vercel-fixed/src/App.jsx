import React, { useEffect, useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import {
  Trash2,
  Plus,
  Euro,
  PiggyBank,
  TrendingUp,
  Wallet,
  AlertTriangle,
  LineChart,
  Sparkles,
  Save,
  RotateCcw,
  Smartphone,
  Upload,
  Download,
} from "lucide-react";
import {
  ResponsiveContainer,
  LineChart as ReLineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  BarChart,
  Bar,
  Legend,
} from "recharts";

const eur = new Intl.NumberFormat("es-ES", {
  style: "currency",
  currency: "EUR",
  maximumFractionDigits: 2,
});

const STORAGE_KEY = "app-control-gastos-iphone-v1";
const APP_NAME = "CONTROL DE GASTOS";

const defaultData = {
  salary1: 0,
  salary2: 0,
  rewardIncome: 0,
  interestIncome: 0,
  targetSavingPct: 20,
  extraIncomeItems: [],
  fixedExpenses: [
    { id: 1, name: "ChatGPT Plus", amount: 20 },
    { id: 2, name: "Club deportivo", amount: 35 },
  ],
  extraExpenseItems: [],
  investments: [
    { id: 1, name: "S&P 500", amount: 150 },
    { id: 2, name: "Oro", amount: 50 },
    { id: 3, name: "ACWI", amount: 100 },
  ],
  variableExpenses: [],
  monthlyHistory: [],
};

function loadInitialData() {
  if (typeof window === "undefined") return defaultData;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return defaultData;
    const parsed = JSON.parse(raw);
    return {
      ...defaultData,
      ...parsed,
      extraIncomeItems: parsed.extraIncomeItems ?? defaultData.extraIncomeItems,
      extraExpenseItems: parsed.extraExpenseItems ?? defaultData.extraExpenseItems,
      fixedExpenses: parsed.fixedExpenses ?? defaultData.fixedExpenses,
      investments: parsed.investments ?? defaultData.investments,
      variableExpenses: parsed.variableExpenses ?? defaultData.variableExpenses,
      monthlyHistory: parsed.monthlyHistory ?? defaultData.monthlyHistory,
    };
  } catch {
    return defaultData;
  }
}

function downloadBackup(data) {
  if (typeof window === "undefined") return;
  const blob = new Blob([JSON.stringify(data, null, 2)], {
    type: "application/json",
  });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = "control-gastos-backup.json";
  link.click();
  URL.revokeObjectURL(url);
}

function NumberField({ label, value, onChange, placeholder = "0" }) {
  return (
    <div className="space-y-2">
      <Label>{label}</Label>
      <Input
        type="number"
        min="0"
        step="0.01"
        value={value}
        placeholder={placeholder}
        onChange={(e) => onChange(Number(e.target.value) || 0)}
      />
    </div>
  );
}

function SectionList({ title, items, setItems, extraField = false }) {
  const [name, setName] = useState("");
  const [amount, setAmount] = useState(0);
  const [category, setCategory] = useState("");

  const addItem = () => {
    if (!name || amount <= 0) return;
    setItems([
      ...items,
      {
        id: Date.now(),
        name,
        amount,
        ...(extraField ? { category: category || "Otros" } : {}),
      },
    ]);
    setName("");
    setAmount(0);
    setCategory("");
  };

  const removeItem = (id) => setItems(items.filter((item) => item.id !== id));

  return (
    <Card className="rounded-2xl shadow-sm">
      <CardHeader>
        <CardTitle className="text-lg">{title}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className={`grid gap-3 ${extraField ? "md:grid-cols-4" : "md:grid-cols-3"}`}>
          <div className="space-y-2 md:col-span-2">
            <Label>Concepto</Label>
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Ej. Netflix"
            />
          </div>
          {extraField && (
            <div className="space-y-2">
              <Label>Categoría</Label>
              <Input
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                placeholder="Ej. Ocio"
              />
            </div>
          )}
          <div className="space-y-2">
            <Label>Importe</Label>
            <Input
              type="number"
              min="0"
              step="0.01"
              value={amount}
              onChange={(e) => setAmount(Number(e.target.value) || 0)}
            />
          </div>
        </div>

        <Button onClick={addItem} className="rounded-2xl w-full sm:w-auto">
          <Plus className="mr-2 h-4 w-4" /> Añadir
        </Button>

        <div className="space-y-2">
          {items.length === 0 && (
            <p className="text-sm text-slate-500">No hay elementos todavía.</p>
          )}
          {items.map((item) => (
            <div
              key={item.id}
              className="flex items-center justify-between rounded-2xl border p-3 gap-3"
            >
              <div className="min-w-0">
                <p className="font-medium break-words">{item.name}</p>
                {extraField && (
                  <p className="text-sm text-slate-500">{item.category}</p>
                )}
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <span className="font-semibold">{eur.format(item.amount)}</span>
                <Button variant="ghost" size="icon" onClick={() => removeItem(item.id)}>
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

function HistoryTable({ history }) {
  const allCategories = Array.from(
    new Set(history.flatMap((m) => Object.keys(m.categories || {})))
  );

  return (
    <div className="overflow-x-auto rounded-2xl border">
      <table className="min-w-full text-sm">
        <thead className="bg-slate-100">
          <tr>
            <th className="px-4 py-3 text-left font-semibold">Mes</th>
            <th className="px-4 py-3 text-left font-semibold">Ingresos</th>
            <th className="px-4 py-3 text-left font-semibold">Ahorro</th>
            {allCategories.map((category) => (
              <th key={category} className="px-4 py-3 text-left font-semibold">
                {category}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {history.map((row) => (
            <tr key={row.id} className="border-t">
              <td className="px-4 py-3 font-medium">{row.month}</td>
              <td className="px-4 py-3">{eur.format(row.income)}</td>
              <td
                className={`px-4 py-3 font-medium ${
                  row.saving < 0 ? "text-red-600" : "text-green-700"
                }`}
              >
                {eur.format(row.saving)}
              </td>
              {allCategories.map((category) => (
                <td key={category} className="px-4 py-3">
                  {eur.format(row.categories?.[category] || 0)}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default function AppControlGastos() {
  const initial = loadInitialData();

  const [salary1, setSalary1] = useState(initial.salary1);
  const [salary2, setSalary2] = useState(initial.salary2);
  const [rewardIncome, setRewardIncome] = useState(initial.rewardIncome);
  const [interestIncome, setInterestIncome] = useState(initial.interestIncome);
  const [targetSavingPct, setTargetSavingPct] = useState(initial.targetSavingPct);
  const [extraIncomeItems, setExtraIncomeItems] = useState(
    initial.extraIncomeItems || []
  );
  const [fixedExpenses, setFixedExpenses] = useState(initial.fixedExpenses);
  const [extraExpenseItems, setExtraExpenseItems] = useState(
    initial.extraExpenseItems || []
  );
  const [investments, setInvestments] = useState(initial.investments);
  const [variableExpenses, setVariableExpenses] = useState(initial.variableExpenses);
  const [monthlyHistory, setMonthlyHistory] = useState(initial.monthlyHistory);

  const [simOcioCut, setSimOcioCut] = useState(50);
  const [simInvestmentCut, setSimInvestmentCut] = useState(30);
  const [historyMonth, setHistoryMonth] = useState("");
  const [historyIncome, setHistoryIncome] = useState(0);
  const [historySaving, setHistorySaving] = useState(0);
  const [historyCategoryText, setHistoryCategoryText] = useState(
    "Hogar:220, Transporte:120, Ocio:140, Otros:50"
  );
  const [saveMessage, setSaveMessage] = useState("");
  const [importMessage, setImportMessage] = useState("");

  useEffect(() => {
    const dataToSave = {
      salary1,
      salary2,
      rewardIncome,
      interestIncome,
      targetSavingPct,
      extraIncomeItems,
      fixedExpenses,
      extraExpenseItems,
      investments,
      variableExpenses,
      monthlyHistory,
    };

    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(dataToSave));
    setSaveMessage("Datos guardados en este iPhone");
    const timer = setTimeout(() => setSaveMessage(""), 1800);
    return () => clearTimeout(timer);
  }, [
    salary1,
    salary2,
    rewardIncome,
    interestIncome,
    targetSavingPct,
    extraIncomeItems,
    fixedExpenses,
    extraExpenseItems,
    investments,
    variableExpenses,
    monthlyHistory,
  ]);

  const resetAllData = () => {
    const cleanData = {
      ...defaultData,
      extraIncomeItems: [],
      fixedExpenses: defaultData.fixedExpenses.map((item) => ({ ...item })),
      extraExpenseItems: [],
      investments: defaultData.investments.map((item) => ({ ...item })),
      variableExpenses: [],
      monthlyHistory: [],
    };

    setSalary1(cleanData.salary1);
    setSalary2(cleanData.salary2);
    setRewardIncome(cleanData.rewardIncome);
    setInterestIncome(cleanData.interestIncome);
    setTargetSavingPct(cleanData.targetSavingPct);
    setExtraIncomeItems(cleanData.extraIncomeItems);
    setFixedExpenses(cleanData.fixedExpenses);
    setExtraExpenseItems(cleanData.extraExpenseItems);
    setInvestments(cleanData.investments);
    setVariableExpenses(cleanData.variableExpenses);
    setMonthlyHistory(cleanData.monthlyHistory);

    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(cleanData));
    setSaveMessage("Datos reiniciados");
    setImportMessage("");
  };

  const exportData = () => {
    downloadBackup({
      salary1,
      salary2,
      rewardIncome,
      interestIncome,
      targetSavingPct,
      extraIncomeItems,
      fixedExpenses,
      extraExpenseItems,
      investments,
      variableExpenses,
      monthlyHistory,
    });
    setSaveMessage("Copia exportada");
  };

  const importData = (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();

    reader.onload = (e) => {
      try {
        const parsed = JSON.parse(String(e.target?.result || "{}"));
        setSalary1(parsed.salary1 ?? defaultData.salary1);
        setSalary2(parsed.salary2 ?? defaultData.salary2);
        setRewardIncome(parsed.rewardIncome ?? defaultData.rewardIncome);
        setInterestIncome(parsed.interestIncome ?? defaultData.interestIncome);
        setTargetSavingPct(parsed.targetSavingPct ?? defaultData.targetSavingPct);
        setExtraIncomeItems(parsed.extraIncomeItems ?? defaultData.extraIncomeItems);
        setFixedExpenses(parsed.fixedExpenses ?? defaultData.fixedExpenses);
        setExtraExpenseItems(
          parsed.extraExpenseItems ?? defaultData.extraExpenseItems
        );
        setInvestments(parsed.investments ?? defaultData.investments);
        setVariableExpenses(parsed.variableExpenses ?? defaultData.variableExpenses);
        setMonthlyHistory(parsed.monthlyHistory ?? defaultData.monthlyHistory);
        setImportMessage("Copia importada correctamente");
      } catch {
        setImportMessage("No se pudo importar el archivo");
      }
    };

    reader.readAsText(file);
    event.target.value = "";
  };

  const totalExtraIncome = useMemo(
    () => extraIncomeItems.reduce((sum, item) => sum + item.amount, 0),
    [extraIncomeItems]
  );

  const totalIncome = useMemo(
    () => salary1 + salary2 + rewardIncome + interestIncome + totalExtraIncome,
    [salary1, salary2, rewardIncome, interestIncome, totalExtraIncome]
  );

  const totalFixed = useMemo(
    () => fixedExpenses.reduce((sum, item) => sum + item.amount, 0),
    [fixedExpenses]
  );

  const totalExtraExpenses = useMemo(
    () => extraExpenseItems.reduce((sum, item) => sum + item.amount, 0),
    [extraExpenseItems]
  );

  const totalInvestments = useMemo(
    () => investments.reduce((sum, item) => sum + item.amount, 0),
    [investments]
  );

  const totalVariable = useMemo(
    () => variableExpenses.reduce((sum, item) => sum + item.amount, 0),
    [variableExpenses]
  );

  const totalExpenses =
    totalFixed + totalExtraExpenses + totalInvestments + totalVariable;
  const currentSaving = totalIncome - totalExpenses;
  const savingRate = totalIncome > 0 ? (currentSaving / totalIncome) * 100 : 0;
  const targetSaving = totalIncome * (targetSavingPct / 100);
  const missingToTarget = Math.max(targetSaving - currentSaving, 0);

  const categoryBreakdown = useMemo(() => {
    const map = {};
    variableExpenses.forEach((item) => {
      map[item.category] = (map[item.category] || 0) + item.amount;
    });

    return Object.entries(map)
      .map(([category, amount]) => ({
        category,
        amount,
        pctVariable: totalVariable > 0 ? (amount / totalVariable) * 100 : 0,
        pctIncome: totalIncome > 0 ? (amount / totalIncome) * 100 : 0,
      }))
      .sort((a, b) => b.amount - a.amount);
  }, [variableExpenses, totalVariable, totalIncome]);

  const topLeak = categoryBreakdown[0];

  const averageSaving = useMemo(() => {
    if (monthlyHistory.length === 0) return 0;
    return (
      monthlyHistory.reduce((acc, item) => acc + item.saving, 0) /
      monthlyHistory.length
    );
  }, [monthlyHistory]);

  const averageIncome = useMemo(() => {
    if (monthlyHistory.length === 0) return 0;
    return (
      monthlyHistory.reduce((acc, item) => acc + item.income, 0) /
      monthlyHistory.length
    );
  }, [monthlyHistory]);

  const allHistoryCategories = useMemo(() => {
    return Array.from(
      new Set(monthlyHistory.flatMap((item) => Object.keys(item.categories || {})))
    );
  }, [monthlyHistory]);

  const categoryMonthlyAverages = useMemo(() => {
    return allHistoryCategories
      .map((category) => {
        const total = monthlyHistory.reduce(
          (sum, month) => sum + (month.categories?.[category] || 0),
          0
        );
        return {
          category,
          amount: monthlyHistory.length > 0 ? total / monthlyHistory.length : 0,
        };
      })
      .sort((a, b) => b.amount - a.amount);
  }, [allHistoryCategories, monthlyHistory]);

  const worstHistoricalCategory = categoryMonthlyAverages[0];

  const diagnosis = useMemo(() => {
    if (savingRate < 0) {
      return {
        title: "Estás en ahorro negativo",
        text: "Tus gastos e inversión superan tus ingresos mensuales. Necesitas recortar gasto variable o reducir temporalmente inversión para recuperar margen.",
      };
    }
    if (savingRate < 10) {
      return {
        title: "Tu ahorro es demasiado bajo",
        text: "Estás guardando poco margen al mes. El problema probablemente está en el gasto variable o en una aportación de inversión demasiado exigente para tu liquidez actual.",
      };
    }
    if (savingRate < targetSavingPct) {
      return {
        title: "Vas por debajo de tu objetivo",
        text: "Tu estructura financiera es estable, pero todavía no llegas a la tasa de ahorro que quieres. Hay margen de ajuste fino.",
      };
    }
    return {
      title: "Buen equilibrio mensual",
      text: "Tu ahorro actual está alineado o por encima del objetivo marcado. Ahora lo importante es mantener consistencia y controlar fugas pequeñas.",
    };
  }, [savingRate, targetSavingPct]);

  const investmentRate = totalIncome > 0 ? (totalInvestments / totalIncome) * 100 : 0;
  const investmentMessage =
    investmentRate > 25
      ? "Tu nivel de inversión puede estar limitando tu liquidez mensual."
      : investmentRate >= 10
      ? "Tu nivel de inversión es razonable para construir patrimonio sin perder demasiado margen."
      : "Tu nivel de inversión es conservador y deja más liquidez libre.";

  const simulatedSaving = currentSaving + simOcioCut + simInvestmentCut;
  const simulatedSavingRate = totalIncome > 0 ? (simulatedSaving / totalIncome) * 100 : 0;

  const addHistoryMonth = () => {
    if (!historyMonth) return;

    const parsedCategories = historyCategoryText
      .split(",")
      .map((chunk) => chunk.trim())
      .filter(Boolean)
      .reduce((acc, item) => {
        const [key, value] = item.split(":");
        if (key && value) acc[key.trim()] = Number(value.trim()) || 0;
        return acc;
      }, {});

    setMonthlyHistory([
      ...monthlyHistory,
      {
        id: Date.now(),
        month: historyMonth,
        income: historyIncome,
        saving: historySaving,
        categories: parsedCategories,
      },
    ]);

    setHistoryMonth("");
    setHistoryIncome(0);
    setHistorySaving(0);
    setHistoryCategoryText("Hogar:220, Transporte:120, Ocio:140, Otros:50");
  };

  const historyLineData = monthlyHistory.map((item) => ({
    month: item.month,
    ingresos: item.income,
    ahorro: item.saving,
  }));

  const categoryChartData = monthlyHistory.map((item) => {
    const row = { month: item.month };
    allHistoryCategories.forEach((category) => {
      row[category] = item.categories?.[category] || 0;
    });
    return row;
  });

  return (
    <div className="min-h-screen bg-slate-50 p-3 sm:p-4 md:p-8">
      <div className="mx-auto max-w-7xl space-y-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div className="flex flex-col gap-2">
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">
              {APP_NAME}
            </h1>
            <p className="text-sm sm:text-base text-slate-600 max-w-3xl">
              Web pensada para iPhone: guarda tus datos en el navegador,
              controla tus ingresos y gastos, y visualiza tu evolución real mes a mes.
            </p>
          </div>
          <div className="flex flex-col items-stretch gap-2 sm:items-end">
            {saveMessage && <span className="text-xs text-slate-500">{saveMessage}</span>}
            <div className="flex flex-wrap gap-2">
              <Button variant="outline" className="rounded-2xl" onClick={resetAllData}>
                <RotateCcw className="mr-2 h-4 w-4" /> Reiniciar
              </Button>
              <Button variant="outline" className="rounded-2xl" onClick={exportData}>
                <Download className="mr-2 h-4 w-4" /> Exportar
              </Button>
              <Label className="inline-flex cursor-pointer items-center rounded-2xl border px-4 py-2 text-sm font-medium bg-white hover:bg-slate-50">
                <Upload className="mr-2 h-4 w-4" /> Importar
                <input type="file" accept="application/json" className="hidden" onChange={importData} />
              </Label>
              <Button className="rounded-2xl">
                <Save className="mr-2 h-4 w-4" /> Guardado local
              </Button>
            </div>
            {importMessage && <span className="text-xs text-slate-500">{importMessage}</span>}
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <Card className="rounded-2xl shadow-sm">
            <CardContent className="p-5">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-slate-500">Ingresos mensuales</p>
                  <p className="text-2xl font-bold">{eur.format(totalIncome)}</p>
                </div>
                <Wallet className="h-8 w-8" />
              </div>
            </CardContent>
          </Card>

          <Card className="rounded-2xl shadow-sm">
            <CardContent className="p-5">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-slate-500">Gastos totales</p>
                  <p className="text-2xl font-bold">{eur.format(totalExpenses)}</p>
                </div>
                <Euro className="h-8 w-8" />
              </div>
            </CardContent>
          </Card>

          <Card className="rounded-2xl shadow-sm">
            <CardContent className="p-5">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-slate-500">Ahorro estimado</p>
                  <p className={`text-2xl font-bold ${currentSaving < 0 ? "text-red-600" : "text-green-700"}`}>
                    {eur.format(currentSaving)}
                  </p>
                </div>
                <PiggyBank className="h-8 w-8" />
              </div>
            </CardContent>
          </Card>

          <Card className="rounded-2xl shadow-sm">
            <CardContent className="p-5">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-slate-500">Tasa de ahorro</p>
                  <p className="text-2xl font-bold">{savingRate.toFixed(1)}%</p>
                </div>
                <TrendingUp className="h-8 w-8" />
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid gap-6 xl:grid-cols-3">
          <Card className="rounded-2xl shadow-sm xl:col-span-1">
            <CardHeader>
              <CardTitle>Resumen del mes</CardTitle>
            </CardHeader>
            <CardContent className="space-y-5">
              <div className="grid gap-4">
                <NumberField label="Nómina 1" value={salary1} onChange={setSalary1} />
                <NumberField label="Nómina 2" value={salary2} onChange={setSalary2} />
                <NumberField
                  label="Recompensa / cashback / reinversión"
                  value={rewardIncome}
                  onChange={setRewardIncome}
                />
                <NumberField
                  label="Intereses cuenta remunerada"
                  value={interestIncome}
                  onChange={setInterestIncome}
                />
                <NumberField
                  label="Objetivo de ahorro (%)"
                  value={targetSavingPct}
                  onChange={setTargetSavingPct}
                />
              </div>

              <div className="space-y-2 rounded-2xl border p-4">
                <div className="flex items-center justify-between text-sm">
                  <span>Objetivo ahorro</span>
                  <span className="font-medium">{eur.format(targetSaving)}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span>Te falta para llegar</span>
                  <span className="font-medium">{eur.format(missingToTarget)}</span>
                </div>
                <Progress
                  value={Math.max(
                    0,
                    Math.min((currentSaving / Math.max(targetSaving, 1)) * 100, 100)
                  )}
                />
              </div>

              <div className="rounded-2xl border p-4 space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span>Ingresos extra</span>
                  <span className="font-medium">{eur.format(totalExtraIncome)}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span>Gastos fijos</span>
                  <span className="font-medium">{eur.format(totalFixed)}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span>Gastos extra</span>
                  <span className="font-medium">{eur.format(totalExtraExpenses)}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span>Inversión mensual</span>
                  <span className="font-medium">{eur.format(totalInvestments)}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span>Gasto variable</span>
                  <span className="font-medium">{eur.format(totalVariable)}</span>
                </div>
                <div className="flex items-center justify-between text-sm pt-2 border-t">
                  <span>Total gastos</span>
                  <span className="font-semibold">{eur.format(totalExpenses)}</span>
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="xl:col-span-2">
            <Tabs defaultValue="income_extra" className="space-y-4">
              <TabsList className="grid w-full grid-cols-2 sm:grid-cols-5 rounded-2xl gap-1 h-auto">
                <TabsTrigger value="income_extra">Ingresos extra</TabsTrigger>
                <TabsTrigger value="fixed">Gastos fijos</TabsTrigger>
                <TabsTrigger value="expense_extra">Gastos extra</TabsTrigger>
                <TabsTrigger value="variable">Gastos variables</TabsTrigger>
                <TabsTrigger value="investments">Inversiones</TabsTrigger>
              </TabsList>

              <TabsContent value="income_extra">
                <SectionList
                  title="Tus ingresos extra"
                  items={extraIncomeItems}
                  setItems={setExtraIncomeItems}
                />
              </TabsContent>

              <TabsContent value="fixed">
                <SectionList
                  title="Tus gastos fijos mensuales"
                  items={fixedExpenses}
                  setItems={setFixedExpenses}
                />
              </TabsContent>

              <TabsContent value="expense_extra">
                <SectionList
                  title="Tus gastos extra"
                  items={extraExpenseItems}
                  setItems={setExtraExpenseItems}
                />
              </TabsContent>

              <TabsContent value="variable">
                <SectionList
                  title="Tus gastos variables"
                  items={variableExpenses}
                  setItems={setVariableExpenses}
                  extraField
                />
              </TabsContent>

              <TabsContent value="investments">
                <SectionList
                  title="Tus aportaciones mensuales"
                  items={investments}
                  setItems={setInvestments}
                />
              </TabsContent>
            </Tabs>
          </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          <Card className="rounded-2xl shadow-sm">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5" /> Diagnóstico automático
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 text-sm text-slate-700">
              <div className="rounded-2xl border p-4">
                <p className="font-semibold">{diagnosis.title}</p>
                <p className="mt-1">{diagnosis.text}</p>
              </div>

              <div className="rounded-2xl border p-4">
                <p className="font-medium">Peso de la inversión</p>
                <p className="mt-1">
                  Estás destinando {investmentRate.toFixed(1)}% de tus ingresos mensuales a inversión. {investmentMessage}
                </p>
              </div>

              <div className="rounded-2xl border p-4">
                <p className="font-medium">Principal fuga actual</p>
                <p className="mt-1">
                  {topLeak
                    ? `${topLeak.category} es tu mayor gasto variable con ${eur.format(topLeak.amount)}, equivalente al ${topLeak.pctIncome.toFixed(1)}% de tus ingresos mensuales.`
                    : "Todavía no hay suficientes gastos variables cargados."}
                </p>
              </div>

              <div className="rounded-2xl border p-4">
                <p className="font-medium">Promedio de ahorro histórico</p>
                <p className="mt-1">
                  Tu ahorro medio registrado es de {eur.format(averageSaving)} al mes sobre unos ingresos medios de {eur.format(averageIncome)}.
                </p>
              </div>
            </CardContent>
          </Card>

          <Card className="rounded-2xl shadow-sm">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Sparkles className="h-5 w-5" /> Simulador rápido
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <NumberField
                label="Reducir ocio / gasto variable (€)"
                value={simOcioCut}
                onChange={setSimOcioCut}
              />
              <NumberField
                label="Reducir inversión temporalmente (€)"
                value={simInvestmentCut}
                onChange={setSimInvestmentCut}
              />

              <div className="rounded-2xl border p-4 space-y-2 text-sm">
                <div className="flex items-center justify-between">
                  <span>Ahorro actual</span>
                  <span className="font-medium">{eur.format(currentSaving)}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span>Ahorro simulado</span>
                  <span className="font-semibold text-green-700">
                    {eur.format(simulatedSaving)}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span>Nueva tasa de ahorro</span>
                  <span className="font-semibold">{simulatedSavingRate.toFixed(1)}%</span>
                </div>
              </div>

              <div className="rounded-2xl border p-4 text-sm text-slate-700">
                Reduciendo {eur.format(simOcioCut)} de gasto variable y {eur.format(simInvestmentCut)} de inversión, mejorarías tu ahorro mensual en {eur.format(simOcioCut + simInvestmentCut)}.
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          <Card className="rounded-2xl shadow-sm">
            <CardHeader>
              <CardTitle>¿Dónde se te va el dinero ahora?</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {categoryBreakdown.length === 0 ? (
                <p className="text-sm text-slate-500">Añade gastos variables para ver categorías.</p>
              ) : (
                categoryBreakdown.map((item) => (
                  <div key={item.category} className="space-y-1 rounded-2xl border p-3">
                    <div className="flex items-center justify-between text-sm">
                      <span className="font-medium">{item.category}</span>
                      <span>{eur.format(item.amount)}</span>
                    </div>
                    <div className="flex items-center justify-between text-xs text-slate-500">
                      <span>{item.pctVariable.toFixed(1)}% del gasto variable</span>
                      <span>{item.pctIncome.toFixed(1)}% de tus ingresos</span>
                    </div>
                    <Progress value={item.pctVariable} />
                  </div>
                ))
              )}
            </CardContent>
          </Card>

          <Card className="rounded-2xl shadow-sm">
            <CardHeader>
              <CardTitle>Lectura rápida</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 text-sm text-slate-700">
              <div className="rounded-2xl border p-4">
                <p className="font-medium">Mayor categoría histórica</p>
                <p className="mt-1">
                  {worstHistoricalCategory
                    ? `En tu histórico, la categoría con mayor media mensual es ${worstHistoricalCategory.category}, con ${eur.format(worstHistoricalCategory.amount)} al mes.`
                    : "Todavía no hay histórico suficiente."}
                </p>
              </div>

              <div className="rounded-2xl border p-4">
                <p className="font-medium">Margen disponible real</p>
                <p className="mt-1">
                  Después de gastos e inversión, te quedan {eur.format(currentSaving)} al mes. Ese es tu margen real para ahorrar, reforzar liquidez o ajustar inversión.
                </p>
              </div>

              <div className="rounded-2xl border p-4">
                <p className="font-medium">Qué mirar primero</p>
                <p className="mt-1">
                  Empieza observando si una sola categoría crece varios meses seguidos. Ahí suele estar la fuga real, más que en los gastos fijos.
                </p>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid gap-6 xl:grid-cols-3">
          <Card className="rounded-2xl shadow-sm xl:col-span-1">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <LineChart className="h-5 w-5" /> Añadir mes al histórico
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Mes</Label>
                <Input
                  value={historyMonth}
                  onChange={(e) => setHistoryMonth(e.target.value)}
                  placeholder="Ej. Abril 2026"
                />
              </div>
              <NumberField label="Ingresos del mes" value={historyIncome} onChange={setHistoryIncome} />
              <NumberField label="Ahorro del mes" value={historySaving} onChange={setHistorySaving} />
              <div className="space-y-2">
                <Label>Gasto por categoría</Label>
                <Input
                  value={historyCategoryText}
                  onChange={(e) => setHistoryCategoryText(e.target.value)}
                  placeholder="Hogar:220, Transporte:120, Ocio:140"
                />
                <p className="text-xs text-slate-500">
                  Formato: Categoría:importe, separado por comas.
                </p>
              </div>
              <Button onClick={addHistoryMonth} className="w-full rounded-2xl">
                Guardar mes
              </Button>
            </CardContent>
          </Card>

          <Card className="rounded-2xl shadow-sm xl:col-span-2">
            <CardHeader>
              <CardTitle>Histórico mes a mes</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <HistoryTable history={monthlyHistory} />
            </CardContent>
          </Card>
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          <Card className="rounded-2xl shadow-sm">
            <CardHeader>
              <CardTitle>Evolución de ingresos y ahorro</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-72 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <ReLineChart data={historyLineData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis />
                    <Tooltip formatter={(value) => eur.format(Number(value))} />
                    <Legend />
                    <Line type="monotone" dataKey="ingresos" strokeWidth={3} />
                    <Line type="monotone" dataKey="ahorro" strokeWidth={3} />
                  </ReLineChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          <Card className="rounded-2xl shadow-sm">
            <CardHeader>
              <CardTitle>Gasto por categoría mes a mes</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-72 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={categoryChartData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis />
                    <Tooltip formatter={(value) => eur.format(Number(value))} />
                    <Legend />
                    {allHistoryCategories.map((category) => (
                      <Bar key={category} dataKey={category} stackId="a" />
                    ))}
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </div>

        <Card className="rounded-2xl shadow-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Smartphone className="h-5 w-5" /> Lista para usar en iPhone
            </CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-slate-700 space-y-4">
            <div className="rounded-2xl border p-4 space-y-2">
              <p className="font-medium">Cómo usarla como si fuera una app</p>
              <p>1. Abre la web en Safari en tu iPhone.</p>
              <p>2. Pulsa el botón de compartir.</p>
              <p>3. Elige “Añadir a pantalla de inicio”.</p>
              <p>4. Se guardará un icono de {APP_NAME} en tu iPhone.</p>
            </div>

            <div className="rounded-2xl border p-4 space-y-2">
              <p className="font-medium">Qué ya hace esta versión</p>
              <p>- Guarda tus datos en el propio navegador del iPhone.</p>
              <p>- Te deja exportar una copia en JSON por seguridad.</p>
              <p>- Te deja importar esa copia si cambias de móvil o borras datos.</p>
              <p>- Está pensada para pantallas pequeñas y uso rápido.</p>
            </div>

            <div className="rounded-2xl border p-4 space-y-2">
              <p className="font-medium">Qué faltaría para dejarla como PWA completa</p>
              <p>- Un icono de app.</p>
              <p>- Un archivo manifest con nombre, colores e icono.</p>
              <p>- Un pequeño ajuste de publicación para que Safari la trate mejor como app.</p>
              <p>- Opcionalmente, modo sin conexión más sólido.</p>
            </div>

            <div className="rounded-2xl border p-4 space-y-2">
              <p className="font-medium">Lo bueno para ti</p>
              <p>
                No necesitas App Store ni conocimientos técnicos profundos. La idea es publicarla en una URL, abrirla en tu iPhone y añadirla a la pantalla de inicio.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
