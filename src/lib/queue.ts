// lib/queue.ts
export interface QueueTicket {
  id: string;
  zoneId: string;
  slotStartTime: string;
  status: 'pending' | 'active' | 'expired';
}

const formatTime = (date: Date) => {
  return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
};

export const joinQueue = (zoneId: string): QueueTicket => {
  const now = new Date();
  const startTime = new Date(now.getTime() + 5 * 60000); // 5 mins in future
  
  return {
    id: `ticket-${Math.random().toString(36).substr(2, 9)}`,
    zoneId,
    slotStartTime: formatTime(startTime),
    status: 'pending'
  };
};

export const checkQueueStatus = (): 'pending' | 'active' | 'expired' => {
  // Simple simulator time logic
  return 'active'; 
};
