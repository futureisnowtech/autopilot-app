'use client';

import React, { useState, useEffect, use } from 'react';
import { 
  Plus, 
  Target, 
  Sparkles, 
  ChevronRight,
  Clock,
  Briefcase,
  FileText,
  Settings,
  MoreVertical,
  CheckCircle2
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { supabase } from '@/lib/supabase';
import { Space, Project, Document, Task } from '@/types/database';
import { toast } from "sonner"

export default function SpaceDashboard({ params }: { params: Promise<{ id: string }> }) {
  const { id: spaceId } = use(params);
  const [space, setSpace] = useState<Space | null>(null);
  const [projects, setProjects] = useState<Project[]>([]);
  const [documents, setDocuments] = useState<Document[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [userId, setUserId] = useState<string | null>(null);

  useEffect(() => {
    async function init() {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        window.location.href = '/auth';
        return;
      }
      setUserId(session.user.id);
      fetchSpaceData();
    }
    init();
  }, [spaceId]);

  async function fetchSpaceData() {
    setIsLoading(true);
    try {
      const [spaceRes, projectsRes, docsRes, tasksRes] = await Promise.all([
        supabase.from('spaces').select('*').eq('id', spaceId).single(),
        supabase.from('projects').select('*').eq('space_id', spaceId).order('created_at', { ascending: false }),
        supabase.from('documents').select('*').eq('space_id', spaceId).order('created_at', { ascending: false }),
        supabase.from('tasks').select('*').eq('space_id', spaceId).neq('status', 'Done').order('priority', { ascending: true })
      ]);

      if (spaceRes.data) setSpace(spaceRes.data);
      if (projectsRes.data) setProjects(projectsRes.data);
      if (docsRes.data) setDocuments(docsRes.data);
      if (tasksRes.data) setTasks(tasksRes.data);
    } catch (err) {
      toast.error("Failed to load workspace");
    } finally {
      setIsLoading(false);
    }
  }

  const handleCreateProject = async () => {
    const name = window.prompt('Project Name:');
    if (!name || !userId) return;

    const { data, error } = await supabase
      .from('projects')
      .insert([{ name, space_id: spaceId, user_id: userId }])
      .select()
      .single();

    if (error) toast.error('Error creating project');
    else setProjects([data, ...projects]);
  };

  const handleCreateDocument = async () => {
    const title = window.prompt('Document Title (e.g. SOP):');
    if (!title || !userId) return;

    const { data, error } = await supabase
      .from('documents')
      .insert([{ title, space_id: spaceId, user_id: userId, type: 'SOP' }])
      .select()
      .single();

    if (error) toast.error('Error creating document');
    else setDocuments([data, ...documents]);
  };

  if (isLoading) return <div className="h-full flex items-center justify-center"><Sparkles className="w-12 h-12 text-indigo-500 animate-pulse" /></div>;
  if (!space) return <div className="text-center py-20">Space not found</div>;

  return (
    <div className="space-y-16">
      <header className="flex justify-between items-end">
        <div>
          <div className="flex items-center gap-4 mb-4">
            <div className="w-12 h-12 rounded-2xl flex items-center justify-center text-3xl" style={{ backgroundColor: `${space.theme_color}20`, color: space.theme_color }}>
              {space.icon || '📁'}
            </div>
            <Badge variant="outline" className="uppercase tracking-widest text-[10px] font-black border-white/10 text-slate-500">
              {space.type} Workspace
            </Badge>
          </div>
          <h1 className="text-6xl font-black tracking-tight">{space.name}</h1>
        </div>
        <div className="flex gap-4">
          <Button variant="outline" className="rounded-full px-6 border-white/10 hover:bg-white/5 font-bold">
            <Settings className="w-4 h-4 mr-2" /> Space Settings
          </Button>
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-16">
        {/* Main Feed: Tasks */}
        <div className="lg:col-span-2 space-y-12">
          <section>
            <div className="flex items-center justify-between mb-8">
              <h2 className="text-sm font-black uppercase tracking-[0.2em] text-slate-500">Active Tasks</h2>
              <Button variant="ghost" size="sm" className="text-indigo-400 font-bold hover:text-indigo-300">
                <Plus className="w-4 h-4 mr-2" /> New Task
              </Button>
            </div>
            
            <div className="space-y-4">
              {tasks.length > 0 ? tasks.map((task) => (
                <div key={task.id} className="group bg-white/[0.03] border border-white/5 p-6 rounded-[28px] flex items-center gap-8 hover:bg-white/[0.06] transition-all cursor-pointer">
                  <div className="w-12 h-12 rounded-xl bg-white/5 flex items-center justify-center text-indigo-400 group-hover:scale-110 transition-transform">
                    {task.status === 'AI_Do' ? <Sparkles className="w-6 h-6" /> : <Target className="w-6 h-6" />}
                  </div>
                  <div className="flex-1">
                    <p className="font-bold text-xl tracking-tight mb-1">{task.title}</p>
                    <div className="flex items-center gap-4">
                      {task.project_id && (
                        <span className="text-[10px] font-black text-indigo-400 uppercase tracking-widest bg-indigo-500/10 px-2 py-0.5 rounded">
                          {projects.find(p => p.id === task.project_id)?.name}
                        </span>
                      )}
                      <span className="text-xs font-bold text-slate-500 uppercase">{task.urgency}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-4 opacity-0 group-hover:opacity-100 transition-opacity">
                    <Button variant="ghost" size="icon" className="hover:bg-green-500/20 hover:text-green-400 rounded-full">
                      <CheckCircle2 className="w-6 h-6" />
                    </Button>
                    <ChevronRight className="w-5 h-5 text-slate-700" />
                  </div>
                </div>
              )) : (
                <div className="py-20 border-2 border-dashed border-white/5 rounded-[40px] text-center italic text-slate-600 font-medium">
                  No active tasks in this space.
                </div>
              )}
            </div>
          </section>

          {/* Project Grid */}
          <section>
            <div className="flex items-center justify-between mb-8">
              <h2 className="text-sm font-black uppercase tracking-[0.2em] text-slate-500">Active Projects</h2>
              <Button onClick={handleCreateProject} variant="ghost" size="sm" className="text-indigo-400 font-bold">
                <Plus className="w-4 h-4 mr-2" /> New Project
              </Button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {projects.map(project => (
                <Card key={project.id} className="bg-white/5 border-white/5 rounded-[32px] hover:bg-white/[0.08] transition-all cursor-pointer group overflow-hidden">
                  <CardContent className="p-8">
                    <div className="flex justify-between items-start mb-6">
                      <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center text-slate-400 group-hover:text-indigo-400 transition-colors">
                        <Briefcase className="w-5 h-5" />
                      </div>
                      <Badge className="bg-green-500/10 text-green-400 border-none text-[10px] font-black uppercase tracking-widest">{project.status}</Badge>
                    </div>
                    <h3 className="text-xl font-bold mb-2 tracking-tight group-hover:text-white transition-colors">{project.name}</h3>
                    <p className="text-xs text-slate-500 font-medium">{tasks.filter(t => t.project_id === project.id).length} Active Tasks</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </section>
        </div>

        {/* Sidebar: SOPs & Knowledge Base */}
        <div className="space-y-12">
          <section>
            <div className="flex items-center justify-between mb-8">
              <h2 className="text-sm font-black uppercase tracking-[0.2em] text-slate-500">Library (SOPs)</h2>
              <Button onClick={handleCreateDocument} variant="ghost" size="sm" className="text-indigo-400 font-bold p-0">
                <Plus className="w-4 h-4" />
              </Button>
            </div>
            <div className="space-y-3">
              {documents.map(doc => (
                <div key={doc.id} className="p-5 rounded-2xl bg-white/5 border border-white/5 hover:border-white/10 transition-all cursor-pointer flex items-center gap-4 group">
                  <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center text-slate-500 group-hover:text-amber-400 transition-colors">
                    <FileText className="w-5 h-5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold truncate tracking-tight">{doc.title}</p>
                    <p className="text-[10px] font-black uppercase tracking-widest text-slate-600">{doc.type}</p>
                  </div>
                  <MoreVertical className="w-4 h-4 text-slate-700 opacity-0 group-hover:opacity-100 transition-opacity" />
                </div>
              ))}
              {documents.length === 0 && (
                <p className="text-center py-10 text-xs text-slate-700 font-bold uppercase tracking-widest italic border border-dashed border-white/5 rounded-2xl">Library Empty</p>
              )}
            </div>
          </section>

          {/* Space Intelligence */}
          <Card className="bg-indigo-600/10 border-indigo-500/20 rounded-[32px] overflow-hidden relative shadow-2xl">
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-indigo-500 to-purple-500" />
            <CardContent className="p-8">
              <div className="flex items-center gap-2 mb-6 text-indigo-400">
                <Sparkles className="w-4 h-4" />
                <span className="text-[10px] font-black uppercase tracking-widest">Space Insights</span>
              </div>
              <p className="text-lg leading-relaxed text-slate-300 font-medium italic">
                "AI is monitoring {projects.length} projects in this space. Ready to generate high-fidelity reports upon request."
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
