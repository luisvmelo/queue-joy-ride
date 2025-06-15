import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Calendar, X } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface EventManagerProps {
  restaurantId: string;
  currentEvent: string | null;
  eventType: string | null;
  onUpdate: () => void;
}

const EventManager = ({ restaurantId, currentEvent, eventType, onUpdate }: EventManagerProps) => {
  const { toast } = useToast();
  const [isEditing, setIsEditing] = useState(false);
  const [newEvent, setNewEvent] = useState(currentEvent || "");
  const [newEventType, setNewEventType] = useState(eventType || "");
  const [loading, setLoading] = useState(false);

  const eventTypes = [
    { value: "happy_hour", label: "Happy Hour", icon: "🍻" },
    { value: "live_music", label: "Música ao Vivo", icon: "🎵" },
    { value: "karaoke", label: "Karaokê", icon: "🎤" },
    { value: "sports", label: "Jogo de Futebol", icon: "⚽" },
    { value: "trivia", label: "Quiz Night", icon: "🧠" },
    { value: "special_menu", label: "Menu Especial", icon: "🍽️" },
    { value: "other", label: "Outro", icon: "🎉" }
  ];

  const handleSaveEvent = async () => {
    setLoading(true);
    try {
      const { error } = await supabase
        .from('restaurants')
        .update({
          current_event: newEvent || null,
          event_type: newEventType || null
        })
        .eq('id', restaurantId);

      if (error) throw error;

      toast({
        title: "Evento atualizado!",
        description: newEvent ? "O evento foi definido com sucesso." : "O evento foi removido."
      });

      setIsEditing(false);
      onUpdate();
    } catch (error: any) {
      toast({
        title: "Erro",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveEvent = async () => {
    setNewEvent("");
    setNewEventType("");
    await handleSaveEvent();
  };

  if (!isEditing) {
    return (
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-base">Evento do Dia</CardTitle>
          <Button size="sm" variant="outline" onClick={() => setIsEditing(true)}>
            <Calendar className="h-4 w-4 mr-2" />
            {currentEvent ? "Editar" : "Adicionar"}
          </Button>
        </CardHeader>
        <CardContent>
          {currentEvent ? (
            <div className="space-y-2">
              <p className="font-medium">{currentEvent}</p>
              {eventType && (
                <p className="text-sm text-gray-600">
                  {eventTypes.find(e => e.value === eventType)?.icon} {' '}
                  {eventTypes.find(e => e.value === eventType)?.label}
                </p>
              )}
            </div>
          ) : (
            <p className="text-sm text-gray-500">Nenhum evento definido</p>
          )}
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Gerenciar Evento</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label>Tipo de Evento</Label>
          <Select value={newEventType} onValueChange={setNewEventType}>
            <SelectTrigger>
              <SelectValue placeholder="Selecione o tipo de evento" />
            </SelectTrigger>
            <SelectContent>
              {eventTypes.map(type => (
                <SelectItem key={type.value} value={type.value}>
                  <span className="flex items-center gap-2">
                    <span>{type.icon}</span>
                    <span>{type.label}</span>
                  </span>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label>Descrição do Evento</Label>
          <Input
            value={newEvent}
            onChange={(e) => setNewEvent(e.target.value)}
            placeholder="Ex: Happy Hour das 18h às 20h"
          />
        </div>

        <div className="flex gap-2">
          <Button
            size="sm"
            onClick={handleSaveEvent}
            disabled={loading || !newEventType}
          >
            Salvar
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={() => {
              setIsEditing(false);
              setNewEvent(currentEvent || "");
              setNewEventType(eventType || "");
            }}
            disabled={loading}
          >
            Cancelar
          </Button>
          {currentEvent && (
            <Button
              size="sm"
              variant="destructive"
              onClick={handleRemoveEvent}
              disabled={loading}
            >
              <X className="h-4 w-4" />
              Remover
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default EventManager;