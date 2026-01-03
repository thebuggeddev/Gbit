import React, { useState, useEffect } from 'react';
import { Goal, GoalCategory, GoalEntry } from './types';
import { loadData, saveData, calculateProgress, getCategoryColor } from './services/storage';
import { Card, Button, Input, Select, ProgressBar } from './components/ui';
import { Heatmap } from './components/Heatmap';
import { OverviewCharts } from './components/Charts';
import { GoalDetail } from './components/GoalDetail';

// --- Icons ---
const PlusIcon = () => <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>;
const LinkIcon = () => <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" /></svg>;

const App = () => {
  const [goals, setGoals] = useState<Goal[]>([]);
  const [isAddGoalModalOpen, setIsAddGoalModalOpen] = useState(false);
  const [isEditGoalModalOpen, setIsEditGoalModalOpen] = useState(false);
  const [activeGoalForEntry, setActiveGoalForEntry] = useState<Goal | null>(null);
  
  // View State
  const [view, setView] = useState<'dashboard' | 'detail'>('dashboard');
  const [currentGoalId, setCurrentGoalId] = useState<string | null>(null);

  // Load data on mount
  useEffect(() => {
    const data = loadData();
    setGoals(data.goals);
  }, []);

  // Save data on change
  useEffect(() => {
    saveData({ goals });
  }, [goals]);

  // --- Keyboard Shortcuts ---
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      // Skip if typing in an input/textarea
      if (['INPUT', 'TEXTAREA', 'SELECT'].includes(target.tagName)) {
        if (e.key === 'Escape') target.blur();
        return;
      }

      // GLOBAL: Escape to close modals or go back
      if (e.key === 'Escape') {
        if (isAddGoalModalOpen) {
          setIsAddGoalModalOpen(false);
          return;
        }
        if (isEditGoalModalOpen) {
            setIsEditGoalModalOpen(false);
            return;
        }
        if (activeGoalForEntry) {
          setActiveGoalForEntry(null);
          return;
        }
        if (view === 'detail') {
          setView('dashboard');
          setCurrentGoalId(null);
          return;
        }
      }

      // DASHBOARD: 'C' or 'N' to Create Goal
      if (view === 'dashboard' && !isAddGoalModalOpen && !activeGoalForEntry) {
        if (e.key.toLowerCase() === 'c' || e.key.toLowerCase() === 'n') {
          e.preventDefault();
          setIsAddGoalModalOpen(true);
        }
      }

      // DETAIL: 'L' or 'E' to Log Entry
      if (view === 'detail' && currentGoalId && !isAddGoalModalOpen && !activeGoalForEntry && !isEditGoalModalOpen) {
        if (e.key.toLowerCase() === 'l' || e.key.toLowerCase() === 'e') {
          e.preventDefault();
          const goal = goals.find(g => g.id === currentGoalId);
          if (goal) setActiveGoalForEntry(goal);
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [view, isAddGoalModalOpen, isEditGoalModalOpen, activeGoalForEntry, currentGoalId, goals]);

  // --- Actions ---

  const handleCreateGoal = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const category = formData.get('category') as GoalCategory;
    const title = formData.get('title') as string;
    const targetValue = parseFloat(formData.get('targetValue') as string) || 0;
    const link = formData.get('link') as string;
    
    // Auto-assign unit based on category
    let unit = '';
    if (category === GoalCategory.LEARNING) unit = 'lessons';
    else if (category === GoalCategory.BOOK) unit = 'chapters';
    else if (category === GoalCategory.MONEY) unit = 'INR';

    const newGoal: Goal = {
      id: crypto.randomUUID(),
      title,
      category,
      targetValue,
      currentValue: 0,
      unit,
      link,
      entries: []
    };

    setGoals([...goals, newGoal]);
    setIsAddGoalModalOpen(false);
  };

  const handleEditGoalSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const currentGoal = goals.find(g => g.id === currentGoalId);
    if (!currentGoal) return;

    const formData = new FormData(e.currentTarget);
    const updatedGoal: Goal = {
      ...currentGoal,
      title: formData.get('title') as string,
      category: formData.get('category') as GoalCategory,
      targetValue: parseFloat(formData.get('targetValue') as string) || 0,
      link: formData.get('link') as string,
    };

    setGoals(goals.map(g => g.id === updatedGoal.id ? updatedGoal : g));
    setIsEditGoalModalOpen(false);
  };

  const handleUpdateGoal = (updatedGoal: Goal) => {
    setGoals(goals.map(g => g.id === updatedGoal.id ? updatedGoal : g));
  };

  const handleDeleteGoal = (id: string) => {
    if(confirm('Are you sure you want to delete this goal permanently?')) {
      setGoals(goals.filter(g => g.id !== id));
      setView('dashboard');
      setCurrentGoalId(null);
    }
  };

  const handleDeleteEntry = (goalId: string, entryId: string) => {
    if(!confirm("Delete this entry?")) return;
    
    setGoals(goals.map(g => {
        if (g.id !== goalId) return g;
        
        const entryToRemove = g.entries.find(e => e.id === entryId);
        const valToRemove = entryToRemove ? entryToRemove.value : 0;
        
        return {
            ...g,
            currentValue: g.currentValue - valToRemove,
            entries: g.entries.filter(e => e.id !== entryId)
        };
    }));
  };

  const handleAddEntry = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!activeGoalForEntry) return;

    const formData = new FormData(e.currentTarget);
    const value = parseFloat(formData.get('value') as string) || 0;
    const description = formData.get('description') as string;
    const date = formData.get('date') as string;

    const newEntry: GoalEntry = {
      id: crypto.randomUUID(),
      date,
      description,
      value,
      timestamp: Date.now()
    };

    const updatedGoals = goals.map(g => {
      if (g.id === activeGoalForEntry.id) {
        return {
          ...g,
          currentValue: g.currentValue + value,
          entries: [...g.entries, newEntry]
        };
      }
      return g;
    });

    setGoals(updatedGoals);
    setActiveGoalForEntry(null);
  };

  // Helper for Ctrl+Enter submission
  const handleFormKeyDown = (e: React.KeyboardEvent<HTMLFormElement>) => {
    if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
      e.currentTarget.requestSubmit();
    }
  };

  const openGoalDetail = (goal: Goal) => {
      setCurrentGoalId(goal.id);
      setView('detail');
      window.scrollTo(0,0);
  };

  // --- Render Helpers ---

  const currentGoal = goals.find(g => g.id === currentGoalId);

  return (
    <div className="min-h-screen pb-20 font-sans text-neo-black bg-[#f3f4f6]">
      {/* Header */}
      <nav className="bg-neo-yellow border-b-2 border-neo-black sticky top-0 z-30">
        <div className="max-w-5xl mx-auto px-4 h-16 flex items-center justify-between">
          <div 
            className="flex items-center gap-2 cursor-pointer" 
            onClick={() => { setView('dashboard'); setCurrentGoalId(null); }}
          >
            <div className="w-10 h-10 bg-black shadow-neo-sm rounded-lg flex items-center justify-center text-white font-display text-2xl pt-1">
              G
            </div>
            <h1 className="font-display text-3xl tracking-wide">Gbit</h1>
          </div>
          {view === 'dashboard' && (
            <Button size="sm" onClick={() => setIsAddGoalModalOpen(true)} tooltip="C" tooltipPosition="bottom">
                <PlusIcon /> New Goal
            </Button>
          )}
        </div>
      </nav>

      <main className="max-w-5xl mx-auto px-4 py-8 space-y-8">
        
        {view === 'dashboard' ? (
            <>
                {/* 1. Heatmap */}
                <section>
                <Heatmap goals={goals} />
                </section>

                {/* 2. Charts */}
                <section>
                <OverviewCharts goals={goals} />
                </section>

                {/* 3. Goal List */}
                <section>
                <div className="flex items-center justify-between mb-4">
                    <h2 className="text-2xl font-bold border-b-4 border-neo-blue inline-block">Your 2026 Goals</h2>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {goals.map(goal => {
                    const progress = calculateProgress(goal);
                    const colorClass = getCategoryColor(goal.category);
                    
                    return (
                        <Card 
                            key={goal.id} 
                            className="flex flex-col gap-4 relative group transition-all hover:-translate-y-1 cursor-pointer hover:shadow-neo-lg"
                        >
                            <div onClick={() => openGoalDetail(goal)} className="flex-1">
                                <div className="flex justify-between items-start">
                                    <div>
                                    <span className={`text-xs font-bold px-2 py-1 rounded border border-neo-black mb-2 inline-block ${colorClass}`}>
                                        {goal.category}
                                    </span>
                                    <h3 className="font-bold text-xl">{goal.title}</h3>
                                    </div>
                                    {goal.link && (
                                        <div 
                                            className="text-neo-black hover:text-neo-blue p-1"
                                            onClick={(e) => { e.stopPropagation(); window.open(goal.link, '_blank'); }}
                                            title="External Link"
                                        >
                                            <LinkIcon />
                                        </div>
                                    )}
                                </div>

                                {/* Progress Section */}
                                <div className="space-y-1 mt-4">
                                    <div className="flex justify-between text-sm font-medium">
                                    <span>{goal.currentValue} / {goal.targetValue > 0 ? goal.targetValue : '∞'} {goal.unit}</span>
                                    <span>{progress}%</span>
                                    </div>
                                    {goal.targetValue > 0 && (
                                    <ProgressBar current={goal.currentValue} total={goal.targetValue} colorClass={colorClass.replace('bg-', 'bg-')} />
                                    )}
                                </div>
                            </div>

                            <div className="mt-auto pt-2 flex gap-2">
                                <Button 
                                    variant="neutral" 
                                    className="flex-1 text-sm bg-gray-50 hover:bg-white z-10" 
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        setActiveGoalForEntry(goal);
                                    }}
                                >
                                <PlusIcon /> Quick Log
                                </Button>
                            </div>
                        </Card>
                    );
                    })}
                </div>

                {goals.length === 0 && (
                     <div className="flex flex-col items-center justify-center py-16 border-4 border-dashed border-gray-300 rounded-xl bg-gray-50 mt-8">
                        <div className="bg-neo-yellow/20 p-4 rounded-full mb-4">
                            <PlusIcon />
                        </div>
                        <p className="text-gray-500 font-bold text-xl mb-6">No goals set for 2026 yet.</p>
                        <Button size="lg" onClick={() => setIsAddGoalModalOpen(true)}>Start Your Year</Button>
                    </div>
                )}
                </section>
            </>
        ) : (
            currentGoal && (
                <GoalDetail 
                    goal={currentGoal} 
                    onBack={() => setView('dashboard')}
                    onEdit={() => setIsEditGoalModalOpen(true)}
                    onDeleteGoal={handleDeleteGoal}
                    onDeleteEntry={handleDeleteEntry}
                    onAddEntry={() => setActiveGoalForEntry(currentGoal)}
                />
            )
        )}
      </main>

      {/* --- Modals --- */}

      {/* Add Goal Modal */}
      {isAddGoalModalOpen && (
        <div 
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fade-in"
            onClick={(e) => { if (e.target === e.currentTarget) setIsAddGoalModalOpen(false); }}
        >
          <Card className="w-full max-w-md animate-scale-up">
            <h2 className="text-2xl font-bold mb-4 font-display">New 2026 Goal</h2>
            <form onSubmit={handleCreateGoal} onKeyDown={handleFormKeyDown} className="space-y-4">
              <div>
                <label className="block text-sm font-bold mb-1">Goal Name</label>
                <Input name="title" placeholder="e.g., Learn React Native" required autoFocus />
              </div>
              
              <div>
                <label className="block text-sm font-bold mb-1">Category</label>
                <Select name="category" required>
                  {Object.values(GoalCategory).map(c => <option key={c} value={c}>{c}</option>)}
                </Select>
              </div>

              <div>
                <label className="block text-sm font-bold mb-1">Target Value (Optional)</label>
                <Input name="targetValue" type="number" min="0" step="any" placeholder="e.g. 50" />
              </div>

              <div>
                <label className="block text-sm font-bold mb-1">Link (Optional)</label>
                <Input name="link" placeholder="e.g. https://course.com" />
                <p className="text-xs text-gray-500 mt-1">Add a link to your course, book, or tracker.</p>
              </div>

              <div className="flex gap-2 pt-4">
                <Button type="button" variant="neutral" className="flex-1" onClick={() => setIsAddGoalModalOpen(false)} tooltip="Esc">Cancel</Button>
                <Button type="submit" className="flex-1" tooltip="Ctrl + Enter">Create Goal</Button>
              </div>
            </form>
          </Card>
        </div>
      )}

      {/* Edit Goal Modal */}
      {isEditGoalModalOpen && currentGoal && (
        <div 
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fade-in"
            onClick={(e) => { if (e.target === e.currentTarget) setIsEditGoalModalOpen(false); }}
        >
          <Card className="w-full max-w-md animate-scale-up">
            <h2 className="text-2xl font-bold mb-4 font-display">Edit Goal</h2>
            <form onSubmit={handleEditGoalSubmit} onKeyDown={handleFormKeyDown} className="space-y-4">
              <div>
                <label className="block text-sm font-bold mb-1">Goal Name</label>
                <Input name="title" defaultValue={currentGoal.title} required autoFocus />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-bold mb-1">Category</label>
                    <Select name="category" defaultValue={currentGoal.category} required>
                      {Object.values(GoalCategory).map(c => <option key={c} value={c}>{c}</option>)}
                    </Select>
                  </div>
                  <div>
                    <label className="block text-sm font-bold mb-1">External Link</label>
                    <Input name="link" defaultValue={currentGoal.link || ''} placeholder="https://..." />
                  </div>
              </div>

              <div>
                <label className="block text-sm font-bold mb-1">Target Value</label>
                <Input name="targetValue" type="number" step="any" defaultValue={currentGoal.targetValue} />
              </div>

              <div className="flex gap-2 pt-4">
                <Button type="button" variant="neutral" className="flex-1" onClick={() => setIsEditGoalModalOpen(false)} tooltip="Esc">Cancel</Button>
                <Button type="submit" className="flex-1" tooltip="Ctrl + Enter">Save Changes</Button>
              </div>
            </form>
          </Card>
        </div>
      )}

      {/* Add Entry Modal */}
      {activeGoalForEntry && (
        <div 
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fade-in"
            onClick={(e) => { if (e.target === e.currentTarget) setActiveGoalForEntry(null); }}
        >
          <Card className="w-full max-w-md animate-scale-up">
            <h2 className="text-xl font-bold mb-1">Log Progress</h2>
            <p className="text-sm text-gray-500 mb-4">for <span className="font-bold text-neo-black">{activeGoalForEntry.title}</span></p>
            
            <form onSubmit={handleAddEntry} onKeyDown={handleFormKeyDown} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-bold mb-1">Date</label>
                    <Input name="date" type="date" required defaultValue={new Date().toISOString().split('T')[0]} />
                  </div>
                  {activeGoalForEntry.targetValue > 0 || activeGoalForEntry.category === GoalCategory.MONEY ? (
                     <div>
                        <label className="block text-sm font-bold mb-1">Add Value ({activeGoalForEntry.unit})</label>
                        <Input name="value" type="number" step="any" placeholder="1" required autoFocus />
                     </div>
                  ) : (
                    <input type="hidden" name="value" value="1" />
                  )}
              </div>

              <div>
                <label className="block text-sm font-bold mb-1">What did you do?</label>
                <Input name="description" placeholder="e.g. Finished Chapter 3" required autoFocus={!(activeGoalForEntry.targetValue > 0 || activeGoalForEntry.category === GoalCategory.MONEY)} />
              </div>

              <div className="flex gap-2 pt-4">
                <Button type="button" variant="neutral" className="flex-1" onClick={() => setActiveGoalForEntry(null)} tooltip="Esc">Cancel</Button>
                <Button type="submit" className="flex-1" tooltip="Ctrl + Enter">Save Entry</Button>
              </div>
            </form>
          </Card>
        </div>
      )}

    </div>
  );
};

export default App;