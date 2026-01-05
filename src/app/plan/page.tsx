'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

interface Meal {
  name: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  fiber: number;
  prepTime: string;
  ingredients: string[];
  instructions: string;
}

interface DayPlan {
  day: number;
  dayName: string;
  meals: {
    breakfast: Meal;
    snack1: Meal;
    lunch: Meal;
    snack2: Meal;
    dinner: Meal;
  };
  dailyTotals: {
    calories: number;
    protein: number;
    carbs: number;
    fat: number;
    fiber: number;
  };
}

interface MealPlan {
  profile: {
    bmr: number;
    tdee: number;
    targetCalories: number;
    protein: number;
    carbs: number;
    fat: number;
    fiber: number;
    goal: string;
    warnings: string[];
  };
  days: DayPlan[];
  recommendations: string[];
  shoppingList: string[];
}

export default function PlanPage() {
  const router = useRouter();
  const [mealPlan, setMealPlan] = useState<MealPlan | null>(null);
  const [selectedDay, setSelectedDay] = useState(0);
  const [expandedMeal, setExpandedMeal] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'plan' | 'shopping' | 'tips'>('plan');
  const [checkedItems, setCheckedItems] = useState<Set<number>>(new Set());
  const [isGenerating, setIsGenerating] = useState(false);

  useEffect(() => {
    const storedPlan = sessionStorage.getItem('mealPlan');
    if (storedPlan) {
      try {
        setMealPlan(JSON.parse(storedPlan));
      } catch (e) {
        console.error('Failed to parse meal plan:', e);
      }
    }
  }, []);

  const toggleChecked = (idx: number) => {
    setCheckedItems(prev => {
      const newSet = new Set(prev);
      newSet.has(idx) ? newSet.delete(idx) : newSet.add(idx);
      return newSet;
    });
  };

  const generateNextWeek = async () => {
    if (!mealPlan || isGenerating) return;
    setIsGenerating(true);
    try {
      const currentWeek = Math.ceil(mealPlan.days.length / 7);
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'generateWeek', profile: mealPlan.profile, currentWeek }),
      });
      const data = await response.json();
      if (data.days?.length > 0) {
        const updatedPlan = {
          ...mealPlan,
          days: [...mealPlan.days, ...data.days],
          shoppingList: [...new Set([...mealPlan.shoppingList, ...(data.shoppingList || [])])]
        };
        setMealPlan(updatedPlan);
        sessionStorage.setItem('mealPlan', JSON.stringify(updatedPlan));
      }
    } catch (error) {
      console.error('Failed to generate next week:', error);
    } finally {
      setIsGenerating(false);
    }
  };

  if (!mealPlan) {
    return (
      <div className="min-h-screen gradient-bg grid-pattern flex items-center justify-center p-4">
        <div className="glass rounded-2xl p-10 text-center max-w-md border border-zinc-800/50">
          <div className="w-16 h-16 mx-auto mb-6 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center">
            <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          </div>
          <h2 className="text-xl font-semibold text-white mb-2">No Meal Plan Found</h2>
          <p className="text-zinc-400 mb-8 text-sm">Complete the conversation to generate your personalized meal plan.</p>
          <button
            onClick={() => router.push('/')}
            className="px-6 py-3 bg-gradient-to-r from-indigo-500 to-purple-600 text-white rounded-xl hover:opacity-90 transition-all text-sm font-medium"
          >
            Back to Chat
          </button>
        </div>
      </div>
    );
  }

  const currentDay = mealPlan.days[selectedDay];
  const mealTypes = ['breakfast', 'snack1', 'lunch', 'snack2', 'dinner'] as const;
  const mealLabels = { breakfast: 'Breakfast', snack1: 'Morning Snack', lunch: 'Lunch', snack2: 'Afternoon Snack', dinner: 'Dinner' };
  const mealTimes = { breakfast: '8:00', snack1: '10:30', lunch: '13:00', snack2: '16:00', dinner: '19:00' };
  const mealAccents = {
    breakfast: { bg: 'bg-amber-500/10', border: 'border-amber-500/20', text: 'text-amber-400', bar: 'from-amber-500 to-orange-500' },
    snack1: { bg: 'bg-emerald-500/10', border: 'border-emerald-500/20', text: 'text-emerald-400', bar: 'from-emerald-500 to-teal-500' },
    lunch: { bg: 'bg-sky-500/10', border: 'border-sky-500/20', text: 'text-sky-400', bar: 'from-sky-500 to-blue-500' },
    snack2: { bg: 'bg-rose-500/10', border: 'border-rose-500/20', text: 'text-rose-400', bar: 'from-rose-500 to-pink-500' },
    dinner: { bg: 'bg-violet-500/10', border: 'border-violet-500/20', text: 'text-violet-400', bar: 'from-violet-500 to-purple-500' },
  };

  const mealIcons = {
    breakfast: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
      </svg>
    ),
    snack1: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
      </svg>
    ),
    lunch: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
      </svg>
    ),
    snack2: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
      </svg>
    ),
    dinner: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
      </svg>
    ),
  };

  const goalLabels: Record<string, string> = {
    weight_loss: 'Weight Loss', weight_gain: 'Weight Gain', maintenance: 'Maintenance',
    muscle_gain: 'Muscle Gain', health: 'Health Optimization'
  };

  const calorieProgress = (currentDay.dailyTotals.calories / mealPlan.profile.targetCalories) * 100;
  const circumference = 2 * Math.PI * 45;
  const currentWeekNum = Math.ceil(mealPlan.days.length / 7);

  return (
    <div className="min-h-screen gradient-bg grid-pattern">
      {/* Header */}
      <header className="glass sticky top-0 z-50 border-b border-zinc-800/50">
        <div className="max-w-5xl mx-auto px-4 sm:px-6">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-3">
              <button onClick={() => router.push('/')} className="p-2 rounded-lg hover:bg-zinc-800/50 transition-all">
                <svg className="w-5 h-5 text-zinc-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 19l-7-7 7-7" />
                </svg>
              </button>
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center">
                <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
              </div>
              <div>
                <h1 className="text-lg font-semibold text-white tracking-tight">Your Meal Plan</h1>
                <p className="text-xs text-zinc-500">{goalLabels[mealPlan.profile.goal]}</p>
              </div>
            </div>

            <div className="flex items-center space-x-1 bg-zinc-900/50 rounded-lg p-1 border border-zinc-800/50">
              {(['plan', 'shopping', 'tips'] as const).map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                    activeTab === tab
                      ? 'bg-gradient-to-r from-indigo-500 to-purple-600 text-white'
                      : 'text-zinc-400 hover:text-white'
                  }`}
                >
                  {tab.charAt(0).toUpperCase() + tab.slice(1)}
                </button>
              ))}
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 sm:px-6 py-6">
        {/* Warnings */}
        {mealPlan.profile.warnings?.length > 0 && (
          <div className="mb-6 p-4 rounded-xl bg-amber-500/10 border border-amber-500/20">
            <div className="flex items-start space-x-3">
              <svg className="w-5 h-5 text-amber-400 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
              <p className="text-sm text-amber-200/80">{mealPlan.profile.warnings.join(' • ')}</p>
            </div>
          </div>
        )}

        {/* Stats */}
        <div className="grid grid-cols-5 gap-3 mb-6">
          {[
            { label: 'Calories', value: mealPlan.profile.targetCalories, unit: 'kcal', accent: 'text-orange-400', bg: 'bg-orange-500/5', border: 'border-orange-500/20' },
            { label: 'Protein', value: mealPlan.profile.protein, unit: 'g', accent: 'text-red-400', bg: 'bg-red-500/5', border: 'border-red-500/20' },
            { label: 'Carbs', value: mealPlan.profile.carbs, unit: 'g', accent: 'text-blue-400', bg: 'bg-blue-500/5', border: 'border-blue-500/20' },
            { label: 'Fat', value: mealPlan.profile.fat, unit: 'g', accent: 'text-yellow-400', bg: 'bg-yellow-500/5', border: 'border-yellow-500/20' },
            { label: 'Fiber', value: mealPlan.profile.fiber, unit: 'g', accent: 'text-green-400', bg: 'bg-green-500/5', border: 'border-green-500/20' },
          ].map((stat) => (
            <div key={stat.label} className={`rounded-xl p-4 border ${stat.bg} ${stat.border}`}>
              <p className={`text-xs mb-1 ${stat.accent}`}>{stat.label}</p>
              <p className="text-xl font-semibold text-white">
                {stat.value}<span className="text-sm text-zinc-500 ml-1">{stat.unit}</span>
              </p>
            </div>
          ))}
        </div>

        {activeTab === 'plan' && (
          <>
            {/* Day Selector */}
            <div className="flex items-center gap-3 mb-6">
              <div className="flex-1 flex gap-2 overflow-x-auto scrollbar-hide pb-1">
                {mealPlan.days.map((day, idx) => (
                  <button
                    key={idx}
                    onClick={() => { setSelectedDay(idx); setExpandedMeal(null); }}
                    className={`flex-shrink-0 px-4 py-2.5 rounded-xl text-sm font-medium transition-all ${
                      selectedDay === idx
                        ? 'bg-gradient-to-r from-indigo-500 to-purple-600 text-white'
                        : 'glass text-zinc-400 hover:text-white border border-zinc-800/50'
                    }`}
                  >
                    <span className="block text-[10px] uppercase tracking-wider opacity-60">Day {day.day}</span>
                    <span>{day.dayName.slice(0, 3)}</span>
                  </button>
                ))}
              </div>

              {mealPlan.days.length < 28 && (
                <button
                  onClick={generateNextWeek}
                  disabled={isGenerating}
                  className="flex-shrink-0 px-4 py-2.5 rounded-xl text-sm font-medium glass border border-indigo-500/30 text-indigo-400 hover:bg-indigo-500/10 transition-all disabled:opacity-50 flex items-center gap-2"
                >
                  {isGenerating ? (
                    <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                    </svg>
                  ) : (
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                    </svg>
                  )}
                  <span>Week {currentWeekNum + 1}</span>
                </button>
              )}
            </div>

            {/* Daily Progress */}
            <div className="glass rounded-xl p-5 mb-6 border border-zinc-800/50">
              <div className="flex items-center gap-8">
                <div className="relative w-28 h-28 flex-shrink-0">
                  <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
                    <circle cx="50" cy="50" r="45" fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="8" />
                    <circle
                      cx="50" cy="50" r="45" fill="none"
                      stroke="url(#progressGrad)"
                      strokeWidth="8"
                      strokeLinecap="round"
                      strokeDasharray={circumference}
                      strokeDashoffset={circumference - (Math.min(calorieProgress, 100) / 100) * circumference}
                      className="transition-all duration-500"
                    />
                    <defs>
                      <linearGradient id="progressGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                        <stop offset="0%" stopColor="#6366f1" />
                        <stop offset="100%" stopColor="#a855f7" />
                      </linearGradient>
                    </defs>
                  </svg>
                  <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <span className="text-2xl font-bold text-white">{currentDay.dailyTotals.calories}</span>
                    <span className="text-[10px] text-zinc-500">/ {mealPlan.profile.targetCalories}</span>
                  </div>
                </div>

                <div className="flex-1 space-y-3">
                  {[
                    { label: 'Protein', current: currentDay.dailyTotals.protein, target: mealPlan.profile.protein, color: 'from-red-500 to-rose-500', text: 'text-red-400' },
                    { label: 'Carbs', current: currentDay.dailyTotals.carbs, target: mealPlan.profile.carbs, color: 'from-blue-500 to-cyan-500', text: 'text-blue-400' },
                    { label: 'Fat', current: currentDay.dailyTotals.fat, target: mealPlan.profile.fat, color: 'from-yellow-500 to-amber-500', text: 'text-yellow-400' },
                    { label: 'Fiber', current: currentDay.dailyTotals.fiber, target: mealPlan.profile.fiber, color: 'from-green-500 to-emerald-500', text: 'text-green-400' },
                  ].map((macro) => (
                    <div key={macro.label}>
                      <div className="flex justify-between mb-1">
                        <span className={`text-xs ${macro.text}`}>{macro.label}</span>
                        <span className="text-xs text-zinc-300">{macro.current}g / {macro.target}g</span>
                      </div>
                      <div className="h-1.5 bg-zinc-800 rounded-full overflow-hidden">
                        <div
                          className={`h-full bg-gradient-to-r ${macro.color} rounded-full transition-all duration-500`}
                          style={{ width: `${Math.min((macro.current / macro.target) * 100, 100)}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Meals */}
            <div className="space-y-3">
              {mealTypes.map((mealType) => {
                const meal = currentDay.meals[mealType];
                const isExpanded = expandedMeal === mealType;
                const accent = mealAccents[mealType];

                return (
                  <div
                    key={mealType}
                    className={`rounded-xl overflow-hidden border transition-all duration-200 group ${
                      isExpanded ? `${accent.bg} ${accent.border}` : 'glass border-zinc-800/50 hover:border-zinc-600/50'
                    }`}
                  >
                    <button
                      onClick={() => setExpandedMeal(isExpanded ? null : mealType)}
                      className="w-full p-4 flex items-center justify-between transition-all"
                    >
                      <div className="flex items-center gap-4">
                        <div className={`w-12 h-12 rounded-lg ${accent.bg} flex flex-col items-center justify-center border ${accent.border}`}>
                          <span className={accent.text}>{mealIcons[mealType]}</span>
                        </div>
                        <div className="text-left">
                          <div className="flex items-center gap-2">
                            <p className={`text-[11px] uppercase tracking-wider ${accent.text}`}>{mealLabels[mealType]}</p>
                            <span className="text-[10px] text-zinc-500">{mealTimes[mealType]}</span>
                          </div>
                          <p className="text-white font-medium">{meal.name}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        <div className="text-right">
                          <p className="text-lg text-white font-semibold">{meal.calories}</p>
                          <p className="text-[10px] text-zinc-500">kcal</p>
                        </div>
                        <svg
                          className={`w-4 h-4 ${accent.text} transition-transform ${isExpanded ? 'rotate-180' : ''}`}
                          fill="none" stroke="currentColor" viewBox="0 0 24 24"
                        >
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                        </svg>
                      </div>
                    </button>

                    {isExpanded && (
                      <div className="px-4 pb-4 border-t border-zinc-800/50">
                        <div className="grid grid-cols-4 gap-3 py-4">
                          {[
                            { label: 'Protein', value: meal.protein },
                            { label: 'Carbs', value: meal.carbs },
                            { label: 'Fat', value: meal.fat },
                            { label: 'Fiber', value: meal.fiber },
                          ].map((m) => (
                            <div key={m.label} className="text-center p-3 rounded-lg bg-zinc-800/30">
                              <p className="text-lg font-semibold text-white">{m.value}g</p>
                              <p className="text-[10px] text-zinc-500 uppercase">{m.label}</p>
                            </div>
                          ))}
                        </div>

                        <div className="flex items-center gap-2 text-zinc-500 text-sm mb-4">
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                          <span>{meal.prepTime}</span>
                        </div>

                        <div className="mb-4">
                          <p className="text-xs text-zinc-500 uppercase tracking-wider mb-2">Ingredients</p>
                          <div className="grid grid-cols-2 gap-2">
                            {meal.ingredients.map((ing, i) => {
                              // Parse "1 tbsp olive oil" or "1/2 cup flour" or "2 eggs" into quantity and ingredient
                              const match = ing.match(/^([\d½¼¾⅓⅔⅛]+(?:\/\d+)?\s*(?:tbsp|tsp|cup|cups|oz|lb|lbs|g|kg|ml|L|cloves?|pieces?|slices?|medium|large|small|whole|bunch|head|can|cans)?)\s+(.+)$/i);
                              const qty = match ? match[1].trim() : '';
                              const name = match ? match[2] : ing;

                              return (
                                <div key={i} className="flex items-center py-2 px-3 rounded-lg bg-zinc-800/30">
                                  <span className="text-xs text-zinc-500 w-16 text-right pr-3 font-mono">{qty || '•'}</span>
                                  <span className="text-sm text-zinc-200 capitalize">{name}</span>
                                </div>
                              );
                            })}
                          </div>
                        </div>

                        <div>
                          <p className="text-xs text-zinc-500 uppercase tracking-wider mb-2">Instructions</p>
                          <p className="text-sm text-zinc-300 leading-relaxed p-3 rounded-lg bg-zinc-800/30">
                            {meal.instructions}
                          </p>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </>
        )}

        {activeTab === 'shopping' && (
          <div>
            <div className="flex items-center justify-between mb-4">
              <p className="text-sm text-zinc-400">{checkedItems.size} of {mealPlan.shoppingList.length} items</p>
              <div className="w-32 h-1.5 bg-zinc-800 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-indigo-500 to-purple-500 rounded-full transition-all"
                  style={{ width: `${(checkedItems.size / mealPlan.shoppingList.length) * 100}%` }}
                />
              </div>
            </div>
            <div className="grid grid-cols-2 lg:grid-cols-3 gap-2">
              {mealPlan.shoppingList.map((item, idx) => (
                <button
                  key={idx}
                  onClick={() => toggleChecked(idx)}
                  className={`flex items-center gap-3 p-3 rounded-xl text-left text-sm transition-all ${
                    checkedItems.has(idx)
                      ? 'glass border-indigo-500/30 border'
                      : 'glass border border-zinc-800/50 hover:border-zinc-700/50'
                  }`}
                >
                  <div className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-all ${
                    checkedItems.has(idx) ? 'bg-indigo-500 border-indigo-500' : 'border-zinc-600'
                  }`}>
                    {checkedItems.has(idx) && (
                      <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                      </svg>
                    )}
                  </div>
                  <span className={checkedItems.has(idx) ? 'text-zinc-500 line-through' : 'text-zinc-300'}>
                    {item}
                  </span>
                </button>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'tips' && (
          <div>
            <div className="space-y-3">
              {mealPlan.recommendations.map((tip, idx) => (
                <div key={idx} className="glass rounded-xl p-4 border border-zinc-800/50 flex items-start gap-4">
                  <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center flex-shrink-0">
                    <span className="text-white text-sm font-bold">{idx + 1}</span>
                  </div>
                  <p className="text-sm text-zinc-300 leading-relaxed pt-1">{tip}</p>
                </div>
              ))}
            </div>
            <div className="mt-6 p-4 rounded-xl glass border border-zinc-800/50">
              <p className="text-xs text-zinc-500">
                This meal plan is for informational purposes. Consult a healthcare provider for medical advice.
              </p>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
