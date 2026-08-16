import React, { useState, useEffect } from 'react';
import { BookOpen, Flame, TrendingUp, Plus, Settings, Home, Book, Brain, BarChart3 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';

interface Subject {
  id: string;
  name: string;
  examDate: string;
  confidence: 'Beginner' | 'Intermediate' | 'Advanced';
  topics: string[];
  mastery: number;
  weakTopics: string[];
}

interface StudySession {
  date: string;
  subject: string;
  duration: number;
  completed: boolean;
}

interface StudyPack {
  id: string;
  subject: string;
  topic: string;
  explanation: string;
  keyPoints: string[];
  flashcards: { q: string; a: string }[];
  quiz: { q: string; options: string[]; correct: number }[];
}

const StudySister: React.FC = () => {
  const [currentTab, setCurrentTab] = useState('home');
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [studySessions, setStudySessions] = useState<StudySession[]>([]);
  const [studyPacks, setStudyPacks] = useState<StudyPack[]>([]);
  const [showOnboarding, setShowOnboarding] = useState(true);
  const [userName, setUserName] = useState('');
  const [newSubject, setNewSubject] = useState('');
  const [examDate, setExamDate] = useState('');
  const [confidence, setConfidence] = useState<'Beginner' | 'Intermediate' | 'Advanced'>('Intermediate');
  const [selectedSubject, setSelectedSubject] = useState<Subject | null>(null);
  const [materialInput, setMaterialInput] = useState('');
  const [topicInput, setTopicInput] = useState('');
  const [currentFlashcardIndex, setCurrentFlashcardIndex] = useState(0);
  const [currentQuizIndex, setCurrentQuizIndex] = useState(0);
  const [quizScore, setQuizScore] = useState(0);
  const [selectedPack, setSelectedPack] = useState<StudyPack | null>(null);
  const [packView, setPackView] = useState<'overview' | 'flashcards' | 'quiz'>('overview');

  // Load from localStorage
  useEffect(() => {
    const saved = localStorage.getItem('studysister-data');
    if (saved) {
      const data = JSON.parse(saved);
      setUserName(data.userName || '');
      setSubjects(data.subjects || []);
      setStudySessions(data.studySessions || []);
      setStudyPacks(data.studyPacks || []);
      setShowOnboarding(data.subjects?.length === 0);
    }
  }, []);

  // Save to localStorage
  useEffect(() => {
    localStorage.setItem('studysister-data', JSON.stringify({
      userName,
      subjects,
      studySessions,
      studyPacks,
    }));
  }, [userName, subjects, studySessions, studyPacks]);

  const addSubject = () => {
    if (newSubject.trim()) {
      const subject: Subject = {
        id: Date.now().toString(),
        name: newSubject,
        examDate,
        confidence,
        topics: [],
        mastery: confidence === 'Beginner' ? 20 : confidence === 'Intermediate' ? 50 : 80,
        weakTopics: [],
      };
      setSubjects([...subjects, subject]);
      setNewSubject('');
      setExamDate('');
      setConfidence('Intermediate');
      if (subjects.length === 0) {
        setShowOnboarding(false);
      }
    }
  };

  const extractKeyTerms = (text: string): string[] => {
    // Extract potential key terms (capitalized words, common patterns)
    const words = text.match(/\b[A-Z][a-z]+(?:\s+[A-Z][a-z]+)*\b/g) || [];
    return [...new Set(words)].slice(0, 5);
  };

  const generateStudyPack = () => {
    if (!selectedSubject || !materialInput.trim()) return;

    const keyTerms = extractKeyTerms(materialInput);
    const sentences = materialInput.split(/[.!?]+/).filter(s => s.trim().length > 0);
    
    // Generate detailed flashcards from the notes
    const flashcards = [
      {
        q: `Define "${topicInput}" based on the provided material`,
        a: sentences[0]?.trim() || 'Review the first sentence of your notes for the definition'
      },
      {
        q: `What are the key characteristics or components of ${topicInput}?`,
        a: sentences.slice(1, 3).join('. ').trim() || 'Look for descriptive elements in your notes'
      },
      {
        q: `Why is ${topicInput} important to understand?`,
        a: sentences[Math.floor(sentences.length / 2)]?.trim() || 'Consider the context and significance in your material'
      },
      ...keyTerms.slice(0, 2).map((term, i) => ({
        q: `Explain what "${term}" means in the context of ${topicInput}`,
        a: sentences[i + 2]?.trim() || `Find where "${term}" is mentioned in your notes and explain its role`
      })),
      {
        q: `What examples or applications of ${topicInput} are mentioned in your notes?`,
        a: sentences[sentences.length - 1]?.trim() || 'Look for specific examples or use cases in your material'
      }
    ];

    const keyPoints = sentences.slice(0, 4).map(s => s.trim()).filter(s => s.length > 10);

    const pack: StudyPack = {
      id: Date.now().toString(),
      subject: selectedSubject.name,
      topic: topicInput || 'General',
      explanation: `StudySister AI Analysis:\n\nYour study material on "${topicInput}" has been analyzed:\n\n${materialInput}\n\nKey insights: This material covers ${keyTerms.join(', ')}. Focus on understanding how these elements relate and interact.`,
      keyPoints: keyPoints.length > 0 ? keyPoints : [
        'Understand the core definition and concept',
        'Identify key relationships and connections',
        'Practice recall without looking at notes',
        'Apply the concept to real-world examples',
      ],
      flashcards: flashcards.slice(0, 6),
      quiz: [
        { q: `Which of these best describes ${topicInput}?`, options: [
          sentences[0]?.substring(0, 50) || 'Option A',
          'A generic alternative',
          'Another possibility',
          'Yet another choice'
        ], correct: 0 },
        { q: `What is a key characteristic of ${topicInput}?`, options: [
          keyTerms[0] || 'Characteristic 1',
          'Wrong answer',
          'Another wrong answer',
          'Incorrect option'
        ], correct: 0 },
      ],
    };

    setStudyPacks([...studyPacks, pack]);
    setSelectedPack(pack);
    setPackView('overview');
    setMaterialInput('');
    setTopicInput('');
  };

  const getDaysUntilExam = (examDate: string) => {
    const exam = new Date(examDate);
    const today = new Date();
    const diff = exam.getTime() - today.getTime();
    return Math.ceil(diff / (1000 * 3600 * 24));
  };

  const getStudyStreak = () => {
    let streak = 0;
    const today = new Date();
    for (let i = 0; i < 365; i++) {
      const checkDate = new Date(today);
      checkDate.setDate(checkDate.getDate() - i);
      const dateStr = checkDate.toISOString().split('T')[0];
      if (studySessions.find(s => s.date === dateStr && s.completed)) {
        streak++;
      } else if (i > 0) {
        break;
      }
    }
    return streak;
  };

  const logStudySession = (subject: Subject) => {
    const today = new Date().toISOString().split('T')[0];
    setStudySessions([...studySessions, {
      date: today,
      subject: subject.name,
      duration: 25,
      completed: true,
    }]);
    // Update subject mastery
    setSubjects(subjects.map(s =>
      s.id === subject.id ? { ...s, mastery: Math.min(100, s.mastery + 5) } : s
    ));
  };

  // Onboarding
  if (showOnboarding) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-primary/10 via-secondary/5 to-accent/10 flex items-center justify-center p-4">
        <Card className="w-full max-w-md p-8 border-primary/20 shadow-lg">
          <div className="text-center mb-8">
            <div className="flex justify-center mb-4">
              <BookOpen className="w-12 h-12 text-primary" />
            </div>
            <h1 className="text-3xl font-bold text-foreground">StudySister</h1>
            <p className="text-muted-foreground mt-2">Your AI-powered study companion</p>
          </div>

          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium text-foreground">Your name (optional)</label>
              <Input
                placeholder="Enter your name"
                value={userName}
                onChange={(e) => setUserName(e.target.value)}
                className="mt-1 border-primary/30"
              />
            </div>

            <div>
              <label className="text-sm font-medium text-foreground">Subject name</label>
              <Input
                placeholder="e.g., Economics, Biology"
                value={newSubject}
                onChange={(e) => setNewSubject(e.target.value)}
                className="mt-1 border-primary/30"
              />
            </div>

            <div>
              <label className="text-sm font-medium text-foreground">Exam date</label>
              <Input
                type="date"
                value={examDate}
                onChange={(e) => setExamDate(e.target.value)}
                className="mt-1 border-primary/30"
              />
            </div>

            <div>
              <label className="text-sm font-medium text-foreground">Your confidence level</label>
              <div className="grid grid-cols-3 gap-2 mt-2">
                {(['Beginner', 'Intermediate', 'Advanced'] as const).map((level) => (
                  <button
                    key={level}
                    onClick={() => setConfidence(level)}
                    className={`p-2 rounded-lg text-sm font-medium transition ${
                      confidence === level
                        ? 'bg-primary text-primary-foreground'
                        : 'bg-muted text-foreground hover:bg-muted/80'
                    }`}
                  >
                    {level}
                  </button>
                ))}
              </div>
            </div>

            <Button
              onClick={addSubject}
              className="w-full bg-primary hover:bg-primary/90 text-primary-foreground"
            >
              Get Started
            </Button>
          </div>
        </Card>
      </div>
    );
  }

  // Home Tab
  const HomeTab = () => {
    const nextExam = subjects.sort((a, b) =>
      new Date(a.examDate).getTime() - new Date(b.examDate).getTime()
    )[0];
    const daysUntil = nextExam ? getDaysUntilExam(nextExam.examDate) : 0;
    const streak = getStudyStreak();

    return (
      <div className="space-y-6 pb-24">
        {/* Header */}
        <div className="bg-gradient-to-r from-primary/20 to-secondary/20 rounded-lg p-6 border border-primary/20">
          <h1 className="text-2xl font-bold text-foreground">
            {userName ? `Welcome back, ${userName}!` : 'Welcome to StudySister'}
          </h1>
          <p className="text-muted-foreground mt-1">Let's make today count</p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 gap-4">
          <Card className="p-4 border-primary/20 bg-gradient-to-br from-accent/10 to-transparent">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Study Streak</p>
                <p className="text-2xl font-bold text-accent">{streak}</p>
              </div>
              <Flame className="w-8 h-8 text-accent" />
            </div>
          </Card>

          <Card className="p-4 border-primary/20 bg-gradient-to-br from-primary/10 to-transparent">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Days to Exam</p>
                <p className="text-2xl font-bold text-primary">{daysUntil > 0 ? daysUntil : 'Soon!'}</p>
              </div>
              <TrendingUp className="w-8 h-8 text-primary" />
            </div>
          </Card>
        </div>

        {/* Subjects */}
        <div>
          <h2 className="text-lg font-bold text-foreground mb-3">Your Subjects</h2>
          <div className="space-y-3">
            {subjects.map((subject) => (
              <Card
                key={subject.id}
                className="p-4 cursor-pointer border-primary/20 hover:border-primary/40 transition"
                onClick={() => {
                  setSelectedSubject(subject);
                  setCurrentTab('study');
                }}
              >
                <div className="flex items-center justify-between mb-2">
                  <h3 className="font-semibold text-foreground">{subject.name}</h3>
                  <span className="text-xs bg-primary/10 text-primary px-2 py-1 rounded">
                    {subject.mastery}% mastered
                  </span>
                </div>
                <div className="w-full bg-muted rounded-full h-2">
                  <div
                    className="bg-gradient-to-r from-primary to-secondary h-2 rounded-full transition"
                    style={{ width: `${subject.mastery}%` }}
                  />
                </div>
                <p className="text-xs text-muted-foreground mt-2">
                  Exam: {new Date(subject.examDate).toLocaleDateString()}
                </p>
              </Card>
            ))}
          </div>
        </div>

        {/* Add Subject Button */}
        <Button
          onClick={() => setShowOnboarding(true)}
          variant="outline"
          className="w-full border-primary/30 text-primary hover:bg-primary/5"
        >
          <Plus className="w-4 h-4 mr-2" />
          Add Another Subject
        </Button>
      </div>
    );
  };

  // Study Tab
  const StudyTab = () => {
    if (!selectedSubject) {
      return (
        <div className="text-center py-12">
          <p className="text-muted-foreground">Select a subject from Home to start studying</p>
        </div>
      );
    }

    if (selectedPack) {
      if (packView === 'overview') {
        return (
          <div className="space-y-6 pb-24">
            <Button
              variant="ghost"
              onClick={() => setSelectedPack(null)}
              className="text-primary"
            >
              ← Back
            </Button>

            <Card className="p-6 border-primary/20">
              <h2 className="text-xl font-bold text-foreground mb-2">{selectedPack.topic}</h2>
              <p className="text-sm text-muted-foreground mb-4">{selectedPack.subject}</p>
              <div className="prose prose-sm max-w-none">
                <p className="text-foreground whitespace-pre-wrap">{selectedPack.explanation}</p>
              </div>
            </Card>

            <div>
              <h3 className="font-semibold text-foreground mb-3">Key Points</h3>
              <ul className="space-y-2">
                {selectedPack.keyPoints.map((point, i) => (
                  <li key={i} className="flex gap-3 text-foreground">
                    <span className="text-primary font-bold">{i + 1}.</span>
                    <span>{point}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <Button
                onClick={() => setPackView('flashcards')}
                className="bg-primary hover:bg-primary/90 text-primary-foreground"
              >
                <Brain className="w-4 h-4 mr-2" />
                Flashcards
              </Button>
              <Button
                onClick={() => {
                  setPackView('quiz');
                  setCurrentQuizIndex(0);
                  setQuizScore(0);
                }}
                className="bg-accent hover:bg-accent/90 text-accent-foreground"
              >
                Quiz
              </Button>
            </div>
          </div>
        );
      }

      if (packView === 'flashcards') {
        const card = selectedPack.flashcards[currentFlashcardIndex];
        const [flipped, setFlipped] = useState(false);
        const progress = ((currentFlashcardIndex + 1) / selectedPack.flashcards.length) * 100;

        return (
          <div className="space-y-6 pb-24">
            <Button
              variant="ghost"
              onClick={() => setPackView('overview')}
              className="text-primary"
            >
              ← Back
            </Button>

            {/* Progress Bar */}
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <p className="text-sm font-semibold text-foreground">
                  Card {currentFlashcardIndex + 1} of {selectedPack.flashcards.length}
                </p>
                <p className="text-xs text-primary font-bold">{Math.round(progress)}%</p>
              </div>
              <div className="w-full bg-muted rounded-full h-3 overflow-hidden">
                <div
                  className="bg-gradient-to-r from-primary via-accent to-secondary h-3 rounded-full transition-all duration-500 ease-out animate-pulse-glow"
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>

            {/* Flashcard */}
            <div className="text-center">
              <div
                onClick={() => setFlipped(!flipped)}
                className={`p-8 cursor-pointer min-h-80 flex items-center justify-center rounded-xl border-2 transition-all duration-300 ${
                  flipped
                    ? 'bg-gradient-to-br from-accent/20 to-primary/10 border-accent/40'
                    : 'bg-gradient-to-br from-primary/20 to-secondary/10 border-primary/40'
                } hover:shadow-lg hover:scale-105 animate-bounce-in`}
              >
                <div className="text-center px-6">
                  <div className="mb-4">
                    <span className={`text-xs font-bold px-3 py-1 rounded-full ${
                      flipped
                        ? 'bg-accent/30 text-accent'
                        : 'bg-primary/30 text-primary'
                    }`}>
                      {flipped ? '✓ Answer' : '❓ Question'}
                    </span>
                  </div>
                  <p className={`text-lg font-semibold transition-all duration-300 ${
                    flipped ? 'text-accent' : 'text-primary'
                  }`}>
                    {flipped ? card.a : card.q}
                  </p>
                  <p className="text-xs text-muted-foreground mt-6 animate-float">
                    💡 Click to flip
                  </p>
                </div>
              </div>
            </div>

            {/* Navigation */}
            <div className="flex gap-3">
              <Button
                onClick={() => {
                  setCurrentFlashcardIndex(Math.max(0, currentFlashcardIndex - 1));
                  setFlipped(false);
                }}
                disabled={currentFlashcardIndex === 0}
                variant="outline"
                className="flex-1 border-primary/30 text-primary hover:bg-primary/10"
              >
                ← Previous
              </Button>
              <Button
                onClick={() => {
                  setCurrentFlashcardIndex(Math.min(selectedPack.flashcards.length - 1, currentFlashcardIndex + 1));
                  setFlipped(false);
                }}
                disabled={currentFlashcardIndex === selectedPack.flashcards.length - 1}
                className="flex-1 bg-gradient-to-r from-primary to-secondary hover:from-primary/90 hover:to-secondary/90 text-primary-foreground"
              >
                Next →
              </Button>
            </div>
          </div>
        );
      }

      if (packView === 'quiz') {
        const question = selectedPack.quiz[currentQuizIndex];

        if (currentQuizIndex >= selectedPack.quiz.length) {
          return (
            <div className="space-y-6 pb-24 text-center">
              <Card className="p-8 border-primary/20 bg-gradient-to-br from-primary/10 to-transparent">
                <h2 className="text-3xl font-bold text-primary mb-2">Quiz Complete!</h2>
                <p className="text-4xl font-bold text-primary mb-2">{quizScore}/{selectedPack.quiz.length}</p>
                <p className="text-muted-foreground">
                  {Math.round((quizScore / selectedPack.quiz.length) * 100)}% correct
                </p>
              </Card>

              <Button
                onClick={() => {
                  setPackView('overview');
                  logStudySession(selectedSubject);
                }}
                className="w-full bg-primary hover:bg-primary/90 text-primary-foreground"
              >
                Complete Session
              </Button>
            </div>
          );
        }

        return (
          <div className="space-y-6 pb-24">
            <Button
              variant="ghost"
              onClick={() => setPackView('overview')}
              className="text-primary"
            >
              ← Back
            </Button>

            <div>
              <p className="text-sm text-muted-foreground mb-4">
                Question {currentQuizIndex + 1} of {selectedPack.quiz.length}
              </p>
              <Card className="p-6 border-primary/20 mb-6">
                <h3 className="font-semibold text-foreground mb-4">{question.q}</h3>
                <div className="space-y-2">
                  {question.options.map((option, i) => (
                    <button
                      key={i}
                      onClick={() => {
                        if (i === question.correct) {
                          setQuizScore(quizScore + 1);
                        }
                        setCurrentQuizIndex(currentQuizIndex + 1);
                      }}
                      className="w-full p-3 text-left rounded-lg border border-primary/20 hover:bg-primary/5 transition text-foreground"
                    >
                      {option}
                    </button>
                  ))}
                </div>
              </Card>
            </div>
          </div>
        );
      }
    }

    return (
      <div className="space-y-6 pb-24">
        <Card className="p-6 border-primary/20 bg-gradient-to-br from-primary/10 to-transparent">
          <h2 className="text-xl font-bold text-foreground mb-2">{selectedSubject.name}</h2>
          <p className="text-muted-foreground">Mastery: {selectedSubject.mastery}%</p>
        </Card>

        <div>
          <h3 className="font-semibold text-foreground mb-3">Add Study Material</h3>
          <div className="space-y-3">
            <div>
              <label className="text-sm text-muted-foreground">Topic</label>
              <Input
                placeholder="e.g., Supply and Demand"
                value={topicInput}
                onChange={(e) => setTopicInput(e.target.value)}
                className="mt-1 border-primary/30"
              />
            </div>
            <div>
              <label className="text-sm text-muted-foreground">Your notes or material</label>
              <textarea
                placeholder="Paste your notes, text, or describe the topic..."
                value={materialInput}
                onChange={(e) => setMaterialInput(e.target.value)}
                className="w-full p-3 border border-primary/30 rounded-lg bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 min-h-32"
              />
            </div>
            <Button
              onClick={generateStudyPack}
              className="w-full bg-primary hover:bg-primary/90 text-primary-foreground"
            >
              Generate Study Pack
            </Button>
          </div>
        </div>

        {studyPacks.filter(p => p.subject === selectedSubject.name).length > 0 && (
          <div>
            <h3 className="font-semibold text-foreground mb-3">Your Study Packs</h3>
            <div className="space-y-2">
              {studyPacks.filter(p => p.subject === selectedSubject.name).map((pack) => (
                <Card
                  key={pack.id}
                  onClick={() => setSelectedPack(pack)}
                  className="p-4 cursor-pointer border-primary/20 hover:border-primary/40 transition"
                >
                  <p className="font-semibold text-foreground">{pack.topic}</p>
                  <p className="text-xs text-muted-foreground">3 flashcards • 2 quiz questions</p>
                </Card>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  };

  // Practice Tab
  const PracticeTab = () => {
    return (
      <div className="space-y-6 pb-24">
        <Card className="p-6 border-primary/20 bg-gradient-to-br from-accent/10 to-transparent">
          <h2 className="text-lg font-bold text-foreground mb-2">Daily Challenge</h2>
          <p className="text-muted-foreground text-sm mb-4">
            Practice questions from your weakest topics
          </p>
          <Button className="w-full bg-accent hover:bg-accent/90 text-accent-foreground">
            Start Challenge
          </Button>
        </Card>

        <div>
          <h3 className="font-semibold text-foreground mb-3">Recent Quizzes</h3>
          {studyPacks.length === 0 ? (
            <p className="text-muted-foreground text-sm">No quizzes yet. Create a study pack to begin!</p>
          ) : (
            <div className="space-y-2">
              {studyPacks.map((pack) => (
                <Card key={pack.id} className="p-3 border-primary/20">
                  <p className="text-sm font-semibold text-foreground">{pack.topic}</p>
                  <p className="text-xs text-muted-foreground">{pack.subject}</p>
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>
    );
  };

  // Progress Tab
  const ProgressTab = () => {
    return (
      <div className="space-y-6 pb-24">
        <div className="grid grid-cols-2 gap-4">
          <Card className="p-4 border-primary/20">
            <p className="text-xs text-muted-foreground">Total Sessions</p>
            <p className="text-2xl font-bold text-primary">{studySessions.length}</p>
          </Card>
          <Card className="p-4 border-primary/20">
            <p className="text-xs text-muted-foreground">Study Packs</p>
            <p className="text-2xl font-bold text-primary">{studyPacks.length}</p>
          </Card>
        </div>

        <div>
          <h3 className="font-semibold text-foreground mb-3">Subject Progress</h3>
          <div className="space-y-3">
            {subjects.map((subject) => (
              <Card key={subject.id} className="p-4 border-primary/20">
                <div className="flex items-center justify-between mb-2">
                  <p className="font-semibold text-foreground">{subject.name}</p>
                  <span className="text-sm font-bold text-primary">{subject.mastery}%</span>
                </div>
                <div className="w-full bg-muted rounded-full h-2">
                  <div
                    className="bg-gradient-to-r from-primary to-secondary h-2 rounded-full"
                    style={{ width: `${subject.mastery}%` }}
                  />
                </div>
              </Card>
            ))}
          </div>
        </div>
      </div>
    );
  };

  // Profile Tab
  const ProfileTab = () => {
    return (
      <div className="space-y-6 pb-24">
        <Card className="p-6 border-primary/20">
          <h2 className="text-lg font-bold text-foreground mb-4">Profile</h2>
          <div className="space-y-3">
            <div>
              <p className="text-sm text-muted-foreground">Name</p>
              <p className="font-semibold text-foreground">{userName || 'Not set'}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Subjects</p>
              <p className="font-semibold text-foreground">{subjects.length}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Study Streak</p>
              <p className="font-semibold text-foreground">{getStudyStreak()} days 🔥</p>
            </div>
          </div>
        </Card>

        <Button
          onClick={() => {
            localStorage.removeItem('studysister-data');
            setSubjects([]);
            setStudySessions([]);
            setStudyPacks([]);
            setUserName('');
            setShowOnboarding(true);
          }}
          variant="outline"
          className="w-full border-destructive/30 text-destructive hover:bg-destructive/5"
        >
          Reset All Data
        </Button>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Main Content */}
      <div className="max-w-2xl mx-auto px-4 pt-6">
        {currentTab === 'home' && <HomeTab />}
        {currentTab === 'study' && <StudyTab />}
        {currentTab === 'practice' && <PracticeTab />}
        {currentTab === 'progress' && <ProgressTab />}
        {currentTab === 'profile' && <ProfileTab />}
      </div>

      {/* Bottom Navigation */}
      <div className="fixed bottom-0 left-0 right-0 bg-card border-t border-border">
        <div className="max-w-2xl mx-auto px-4 flex justify-around">
          {[
            { id: 'home', icon: Home, label: 'Home' },
            { id: 'study', icon: Book, label: 'Study' },
            { id: 'practice', icon: Brain, label: 'Practice' },
            { id: 'progress', icon: BarChart3, label: 'Progress' },
            { id: 'profile', icon: Settings, label: 'Profile' },
          ].map(({ id, icon: Icon, label }) => (
            <button
              key={id}
              onClick={() => setCurrentTab(id)}
              className={`flex flex-col items-center justify-center py-3 px-4 transition ${
                currentTab === id
                  ? 'text-primary border-t-2 border-primary'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              <Icon className="w-6 h-6" />
              <span className="text-xs mt-1">{label}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

export default StudySister;
