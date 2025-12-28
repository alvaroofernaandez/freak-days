import type { Quest, QuestDifficulty } from "~~/domain/types";
import { useAuthStore } from "~~/stores/auth";
import { useSupabase } from "./useSupabase";

export interface CreateQuestDTO {
  title: string;
  description?: string;
  difficulty: QuestDifficulty;
  exp_reward: number;
  is_recurring?: boolean;
  recurrence_pattern?: string;
  due_date?: string;
  due_time?: string;
  reminder_minutes_before?: number;
}

export function useQuests() {
  const supabase = useSupabase();
  const authStore = useAuthStore();

  async function fetchQuests(): Promise<Quest[]> {
    if (!authStore.userId) return [];

    try {
      const data = await $fetch(`/api/quests?userId=${authStore.userId}`);
      return (data as any[]).map(mapDbToQuest);
    } catch (error) {
      console.error("Error fetching quests:", error);
      return [];
    }
  }

  async function fetchTodayCompletions(): Promise<string[]> {
    if (!authStore.userId) return [];

    try {
      const data = await $fetch(
        `/api/quests/completions?userId=${authStore.userId}`
      );
      return data as string[];
    } catch (error) {
      console.error("Error fetching today completions:", error);
      return [];
    }
  }

  async function createQuest(dto: CreateQuestDTO): Promise<Quest | null> {
    if (!authStore.userId) {
      console.error("No user ID available");
      return null;
    }

    if (!dto.title || !dto.title.trim()) {
      console.error("Title is required");
      return null;
    }

    try {
      const data = await $fetch("/api/quests", {
        method: "POST",
        body: {
          userId: authStore.userId,
          ...dto,
        },
      });
      return mapDbToQuest(data as any);
    } catch (error) {
      console.error("Error in createQuest:", error);
      throw error;
    }
  }

  async function completeQuest(
    questId: string,
    streakCount: number = 1
  ): Promise<number> {
    if (!authStore.userId) return 0;

    try {
      const quest = await getQuestById(questId);
      if (!quest) return 0;

      const result = await $fetch(`/api/quests/${questId}/complete`, {
        method: "POST",
        body: {
          userId: authStore.userId,
          streakCount,
        },
      });

      return (result as any).expEarned || 0;
    } catch (error) {
      console.error("Error completing quest:", error);
      return 0;
    }
  }

  async function getQuestById(id: string): Promise<Quest | null> {
    try {
      const quests = await fetchQuests();
      return quests.find((q) => q.id === id) || null;
    } catch (error) {
      console.error("Error fetching quest:", error);
      return null;
    }
  }

  async function deleteQuest(id: string): Promise<boolean> {
    try {
      await $fetch(`/api/quests/${id}`, {
        method: "PATCH",
        body: { active: false },
      });
      return true;
    } catch (error) {
      console.error("Error deleting quest:", error);
      return false;
    }
  }

  function mapDbToQuest(row: {
    id: string;
    title: string;
    description: string | null;
    difficulty: string;
    expReward: number;
    dueDate: Date | null;
    dueTime: string | null;
    reminderMinutesBefore: number | null;
    createdAt: Date;
  }): Quest {
    const dueDate = row.dueDate;
    const now = new Date();
    const isOverdue = dueDate
      ? dueDate < now ||
        (dueDate.toDateString() === now.toDateString() &&
          row.dueTime &&
          new Date(`${dueDate.toISOString().split("T")[0]}T${row.dueTime}`) <
            now)
      : false;

    return {
      id: row.id,
      title: row.title,
      description: row.description || "",
      difficulty: row.difficulty as QuestDifficulty,
      exp: row.expReward,
      status: "pending",
      streak: 0,
      dueDate: dueDate,
      dueTime: row.dueTime,
      reminderMinutesBefore: row.reminderMinutesBefore,
      createdAt: row.createdAt,
      completedAt: null,
      isOverdue: Boolean(isOverdue),
      isDueSoon: false,
    };
  }

  async function fetchNotifications(): Promise<
    Array<{
      id: string;
      quest_id: string;
      notification_type: "overdue" | "reminder" | "due_soon";
      message: string;
      sent_at: Date;
      read_at: Date | null;
    }>
  > {
    if (!authStore.userId) return [];

    try {
      const data = await $fetch(
        `/api/quests/notifications?userId=${authStore.userId}`
      );
      return (data as any[]).map((n) => ({
        id: n.id,
        quest_id: n.quest_id,
        notification_type: n.notification_type,
        message: n.message,
        sent_at: new Date(n.sent_at),
        read_at: n.read_at ? new Date(n.read_at) : null,
      }));
    } catch (error) {
      console.error("Error fetching notifications:", error);
      return [];
    }
  }

  async function markNotificationRead(
    notificationId: string
  ): Promise<boolean> {
    try {
      await $fetch(`/api/quests/notifications/${notificationId}`, {
        method: "PATCH",
      });
      return true;
    } catch (error) {
      console.error("Error marking notification as read:", error);
      return false;
    }
  }

  async function checkOverdueQuests(): Promise<void> {
    await supabase.rpc("check_overdue_quests");
  }

  async function checkQuestsDueSoon(): Promise<void> {
    await supabase.rpc("check_quests_due_soon");
  }

  return {
    fetchQuests,
    fetchTodayCompletions,
    createQuest,
    completeQuest,
    deleteQuest,
    getQuestById,
    fetchNotifications,
    markNotificationRead,
    checkOverdueQuests,
    checkQuestsDueSoon,
  };
}
