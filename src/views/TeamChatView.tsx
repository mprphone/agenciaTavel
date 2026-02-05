import React, { useEffect, useMemo, useRef, useState } from 'react';
import { MessageCircle, Send, Users2, RefreshCcw, UserRound } from 'lucide-react';
import { useApp } from '../AppContext';

const formatDateTime = (iso: string) => {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return iso;

  return date.toLocaleString('pt-PT', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
};

const initials = (name: string) => {
  const parts = name
    .split(' ')
    .map(chunk => chunk.trim())
    .filter(Boolean);

  if (!parts.length) return 'EQ';
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
};

const TeamChatView = () => {
  const { employees, teamChatMessages, sendTeamChatMessage, refreshTeamChatMessages } = useApp();

  const [selectedEmployeeId, setSelectedEmployeeId] = useState('');
  const [newMessage, setNewMessage] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const messageEndRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!selectedEmployeeId && employees.length > 0) {
      setSelectedEmployeeId(employees[0].id);
    }
  }, [employees, selectedEmployeeId]);

  useEffect(() => {
    const interval = window.setInterval(() => {
      refreshTeamChatMessages().catch(error => {
        console.error(error);
      });
    }, 12000);

    return () => window.clearInterval(interval);
  }, [refreshTeamChatMessages]);

  useEffect(() => {
    messageEndRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' });
  }, [teamChatMessages.length]);

  const selectedEmployee = useMemo(
    () => employees.find(employee => employee.id === selectedEmployeeId) || null,
    [employees, selectedEmployeeId],
  );

  const chatMessages = useMemo(
    () => [...teamChatMessages].sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()),
    [teamChatMessages],
  );

  const handleSendMessage = async (event: React.FormEvent) => {
    event.preventDefault();

    if (!selectedEmployee) {
      setErrorMessage('Selecione o funcionário que vai enviar a mensagem.');
      return;
    }

    if (!newMessage.trim()) return;

    try {
      setIsSending(true);
      setErrorMessage(null);
      await sendTeamChatMessage({
        senderId: selectedEmployee.id,
        senderName: selectedEmployee.name,
        text: newMessage,
        channel: 'geral',
      });
      setNewMessage('');
    } catch (error) {
      console.error(error);
      setErrorMessage('Não foi possível enviar a mensagem para o chat da equipa.');
    } finally {
      setIsSending(false);
    }
  };

  const handleRefresh = async () => {
    try {
      setIsRefreshing(true);
      setErrorMessage(null);
      await refreshTeamChatMessages();
    } catch (error) {
      console.error(error);
      setErrorMessage('Falha ao atualizar o chat da equipa.');
    } finally {
      setIsRefreshing(false);
    }
  };

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-gray-900 tracking-tight">Chat da Equipa</h1>
          <p className="text-gray-500 font-medium">Canal interno para comunicação rápida entre funcionários.</p>
        </div>
        <button
          type="button"
          onClick={handleRefresh}
          className="px-4 py-2 rounded-xl border border-gray-200 bg-white hover:bg-gray-50 text-sm font-black text-gray-700 flex items-center gap-2 transition"
        >
          <RefreshCcw size={16} className={isRefreshing ? 'animate-spin' : ''} /> Atualizar
        </button>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-[320px_1fr] gap-6">
        <aside className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="p-5 border-b bg-gray-50/60">
            <h2 className="text-sm font-black text-gray-900 uppercase tracking-widest flex items-center gap-2">
              <Users2 size={16} /> Remetente
            </h2>
          </div>

          <div className="p-5 space-y-4">
            <label className="text-xs font-black text-gray-400 uppercase tracking-widest">Enviar como</label>
            <select
              value={selectedEmployeeId}
              onChange={event => setSelectedEmployeeId(event.target.value)}
              className="w-full border border-gray-200 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition bg-white"
            >
              {employees.map(employee => (
                <option key={employee.id} value={employee.id}>
                  {employee.name} ({employee.role})
                </option>
              ))}
            </select>

            <div className="pt-4 border-t space-y-3">
              <p className="text-xs font-black text-gray-400 uppercase tracking-widest">Participantes</p>
              <div className="space-y-2 max-h-[360px] overflow-y-auto pr-1">
                {employees.map(employee => (
                  <div
                    key={employee.id}
                    className={`px-3 py-2 rounded-xl border text-sm font-semibold flex items-center justify-between ${
                      employee.id === selectedEmployeeId ? 'border-blue-200 bg-blue-50 text-blue-700' : 'border-gray-200 text-gray-600'
                    }`}
                  >
                    <span className="truncate">{employee.name}</span>
                    <span
                      className={`text-[10px] font-black uppercase tracking-wide px-2 py-1 rounded-full ${
                        employee.status === 'Ativo'
                          ? 'bg-green-100 text-green-700'
                          : employee.status === 'Ausente'
                          ? 'bg-orange-100 text-orange-700'
                          : 'bg-gray-100 text-gray-600'
                      }`}
                    >
                      {employee.status}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </aside>

        <section className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden flex flex-col min-h-[620px]">
          <div className="px-6 py-4 border-b bg-gray-50/60 flex items-center justify-between">
            <h2 className="text-sm font-black text-gray-900 uppercase tracking-widest flex items-center gap-2">
              <MessageCircle size={16} /> Canal Geral
            </h2>
            <p className="text-xs text-gray-500 font-semibold">{chatMessages.length} mensagens</p>
          </div>

          <div className="flex-1 overflow-y-auto p-6 space-y-4 bg-gradient-to-b from-white to-gray-50/40">
            {chatMessages.length === 0 ? (
              <div className="h-full flex items-center justify-center text-gray-400 text-sm font-medium">
                Ainda não há mensagens. Inicie a conversa da equipa.
              </div>
            ) : (
              chatMessages.map(message => {
                const isOwn = selectedEmployeeId && message.senderId === selectedEmployeeId;
                return (
                  <div key={message.id} className={`flex ${isOwn ? 'justify-end' : 'justify-start'}`}>
                    <div className={`max-w-[78%] rounded-2xl px-4 py-3 shadow-sm border ${isOwn ? 'bg-blue-600 text-white border-blue-600' : 'bg-white border-gray-200'}`}>
                      <div className="flex items-center gap-2 mb-2">
                        <span
                          className={`inline-flex h-6 w-6 items-center justify-center rounded-full text-[10px] font-black ${
                            isOwn ? 'bg-blue-500 text-white border border-blue-400' : 'bg-gray-100 text-gray-600 border border-gray-200'
                          }`}
                        >
                          {initials(message.senderName)}
                        </span>
                        <span className={`text-xs font-black ${isOwn ? 'text-blue-100' : 'text-gray-700'}`}>{message.senderName}</span>
                      </div>
                      <p className={`text-sm whitespace-pre-wrap ${isOwn ? 'text-white' : 'text-gray-800'}`}>{message.text}</p>
                      <p className={`mt-2 text-[10px] ${isOwn ? 'text-blue-100' : 'text-gray-400'}`}>{formatDateTime(message.createdAt)}</p>
                    </div>
                  </div>
                );
              })
            )}
            <div ref={messageEndRef} />
          </div>

          <form onSubmit={handleSendMessage} className="p-5 border-t bg-white space-y-3">
            {errorMessage && <div className="px-4 py-3 rounded-xl bg-red-50 border border-red-200 text-sm font-semibold text-red-700">{errorMessage}</div>}

            {!selectedEmployee && (
              <div className="px-4 py-3 rounded-xl bg-amber-50 border border-amber-200 text-sm font-semibold text-amber-700 flex items-center gap-2">
                <UserRound size={16} /> Crie ou selecione um funcionário para enviar mensagens.
              </div>
            )}

            <div className="flex items-end gap-3">
              <textarea
                value={newMessage}
                onChange={event => setNewMessage(event.target.value)}
                rows={2}
                placeholder="Escrever mensagem para a equipa..."
                className="flex-1 border border-gray-200 rounded-2xl px-4 py-3 outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition resize-none"
              />
              <button
                type="submit"
                disabled={isSending || !newMessage.trim() || !selectedEmployee}
                className="h-[46px] px-5 rounded-2xl bg-blue-600 text-white font-black text-xs uppercase tracking-widest hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition flex items-center gap-2"
              >
                <Send size={14} /> {isSending ? 'A enviar' : 'Enviar'}
              </button>
            </div>
          </form>
        </section>
      </div>
    </div>
  );
};

export default TeamChatView;
