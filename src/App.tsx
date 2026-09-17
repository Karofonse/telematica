import { useState, useEffect, useCallback } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { AppProvider, useApp } from '@/context/AppContext';
import { NavBar, type Route } from '@/components/NavBar';
import { Dashboard } from '@/screens/Dashboard';
import { QuizScreen, type QuizResult } from '@/screens/Quiz';
import { QuizResults as Results } from '@/screens/Results';
import { QuestionBank } from '@/screens/QuestionBank';
import { AddEditQuestion } from '@/screens/AddEditQuestion';
import { Stats } from '@/screens/Stats';
import { Achievements } from '@/screens/Achievements';
import { Settings } from '@/screens/Settings';
import type { Question, QuizMode } from '@/lib/types';

function AppContent() {
  const { loading, settings, refresh } = useApp();
  const [route, setRoute] = useState<Route>('dashboard');
  const [quizMode, setQuizMode] = useState<QuizMode>('smart');
  const [quizTopic, setQuizTopic] = useState<string | undefined>(undefined);
  const [quizGroup, setQuizGroup] = useState<number | undefined>(undefined);
  const [quizResult, setQuizResult] = useState<QuizResult | null>(null);
  const [editQuestion, setEditQuestion] = useState<Question | null>(null);

  useEffect(() => {
    const root = document.documentElement;
    if (settings.theme === 'light') {
      root.classList.add('light');
      root.classList.remove('dark');
    } else {
      root.classList.add('dark');
      root.classList.remove('light');
    }
  }, [settings.theme]);

  const navigate = useCallback((r: Route) => {
    if (r === 'add') setEditQuestion(null);
    setRoute(r);
  }, []);

  const startQuiz = useCallback((mode: QuizMode, topic?: string, group?: number) => {
    setQuizMode(mode);
    setQuizTopic(topic);
    setQuizGroup(group);
    setQuizResult(null);
    setRoute('quiz');
  }, []);

  const handleQuizComplete = useCallback((result: QuizResult) => {
    setQuizResult(result);
    setRoute('results');
    setTimeout(() => refresh(), 1500);
  }, [refresh]);

  const handleEdit = useCallback((q: Question) => {
    setEditQuestion(q);
    setRoute('add');
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-950">
        <div className="flex flex-col items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-brand-500 to-accent-500 flex items-center justify-center text-white font-bold font-display text-2xl animate-pulse">S</div>
          <div className="w-8 h-8 border-4 border-brand-500 border-t-transparent rounded-full animate-spin" />
        </div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen ${settings.theme === 'light' ? 'bg-slate-100' : 'bg-slate-950'}`}>
      <NavBar route={route} onNavigate={navigate} />
      <main className="md:ml-20 lg:ml-60 pb-24 md:pb-8">
        <div className="max-w-5xl mx-auto px-4 py-6 md:px-8 md:py-8">
          <AnimatePresence mode="wait">
            <motion.div
              key={route + (editQuestion?.id ?? '')}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
            >
              {route === 'dashboard' && <Dashboard onNavigate={navigate} onStartQuiz={(m, g) => startQuiz(m, undefined, g)} />}
              {route === 'quiz' && (
                <QuizScreen
                  mode={quizMode}
                  topic={quizTopic}
                  group={quizGroup}
                  onNavigate={navigate}
                  onQuizComplete={handleQuizComplete}
                />
              )}
              {route === 'results' && quizResult && (
                <Results
                  result={quizResult}
                  onNavigate={navigate}
                  onRetry={() => startQuiz(quizMode, quizTopic, quizGroup)}
                  onReviewErrors={() => startQuiz('errors')}
                />
              )}
              {route === 'bank' && <QuestionBank onNavigate={navigate} onEdit={handleEdit} />}
              {route === 'add' && <AddEditQuestion editQuestion={editQuestion} onNavigate={navigate} />}
              {route === 'stats' && <Stats onNavigate={navigate} onStartQuiz={(m) => startQuiz(m)} />}
              {route === 'achievements' && <Achievements />}
              {route === 'settings' && <Settings />}
            </motion.div>
          </AnimatePresence>
        </div>
      </main>
    </div>
  );
}

export default function App() {
  return (
    <AppProvider>
      <AppContent />
    </AppProvider>
  );
}
