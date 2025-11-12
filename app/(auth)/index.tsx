import { useAuth, useUser } from "@clerk/clerk-expo";
import { useEffect, useState, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  Platform,
} from "react-native";
import * as Notifications from "expo-notifications";
import {
  registerForPushNotificationsAsync,
  scheduleImmediateNotification,
  scheduleNotificationAtTime,
  scheduleRecurringNotifications,
  scheduleMultipleNotifications,
  cancelAllNotifications,
  getScheduledNotifications,
  addNotificationReceivedListener,
  addNotificationResponseListener,
  NotificationHistoryItem,
} from "@/services/notificationService";

export default function Home() {
  const { signOut } = useAuth();
  const { user } = useUser();
  const [notificationHistory, setNotificationHistory] = useState<
    NotificationHistoryItem[]
  >([]);
  const [scheduledCount, setScheduledCount] = useState(0);
  const [selectedHour, setSelectedHour] = useState(9);
  const [selectedMinute, setSelectedMinute] = useState(0);
  
  const notificationListener = useRef<Notifications.Subscription | null>(null);
  const responseListener = useRef<Notifications.Subscription | null>(null);

  useEffect(() => {
    // Registrar para notificações
    registerForPushNotificationsAsync();

    // Listener para notificações recebidas
    notificationListener.current = addNotificationReceivedListener(
      (notification) => {
        const newItem: NotificationHistoryItem = {
          id: notification.request.identifier,
          title: notification.request.content.title || "Notificação",
          body: notification.request.content.body || "",
          timestamp: Date.now(),
        };
        setNotificationHistory((prev) => [newItem, ...prev]);
      }
    );

    // Listener para quando usuário interage com notificação
    responseListener.current = addNotificationResponseListener((response) => {
      console.log("Notificação clicada:", response);
    });

    // Atualizar contagem de notificações agendadas
    updateScheduledCount();

    return () => {
      if (notificationListener.current) {
        notificationListener.current.remove();
      }
      if (responseListener.current) {
        responseListener.current.remove();
      }
    };
  }, []);

  async function updateScheduledCount() {
    const scheduled = await getScheduledNotifications();
    setScheduledCount(scheduled.length);
  }

  async function handleImmediateNotification() {
    await scheduleImmediateNotification();
    Alert.alert("Sucesso", "Notificação agendada para daqui 2 segundos!");
    updateScheduledCount();
  }

  async function handleScheduleAtTime() {
    await scheduleNotificationAtTime(selectedHour, selectedMinute);
    Alert.alert(
      "Sucesso",
      `Notificação diária agendada para ${selectedHour}:${selectedMinute.toString().padStart(2, "0")}`
    );
    updateScheduledCount();
  }

  async function handleRecurringNotifications() {
    await scheduleRecurringNotifications();
    Alert.alert("Sucesso", "Notificações agendadas a cada 1 hora!");
    updateScheduledCount();
  }

  async function handleMultipleNotifications() {
    await scheduleMultipleNotifications();
    Alert.alert(
      "Sucesso",
      "Notificações agendadas a cada 2 horas (das 8h às 22h)!"
    );
    updateScheduledCount();
  }

  async function handleCancelAll() {
    await cancelAllNotifications();
    Alert.alert("Sucesso", "Todas as notificações foram canceladas!");
    updateScheduledCount();
  }

  function formatTimestamp(timestamp: number) {
    const date = new Date(timestamp);
    return date.toLocaleTimeString("pt-BR", {
      hour: "2-digit",
      minute: "2-digit",
    });
  }

  function clearHistory() {
    setNotificationHistory([]);
  }

  return (
    <ScrollView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerTop}>
          <View>
            <Text style={styles.welcomeText}>Olá, {user?.firstName}!</Text>
            <Text style={styles.subtitle}>Mantenha-se hidratado</Text>
          </View>
          <TouchableOpacity onPress={() => signOut()} style={styles.signOutButton}>
            <Text style={styles.signOutText}>Sair</Text>
          </TouchableOpacity>
        </View>
        
        <View style={styles.statsCard}>
          <Text style={styles.statsNumber}>{scheduledCount}</Text>
          <Text style={styles.statsLabel}>Lembretes Agendados</Text>
        </View>
      </View>

        {/* Histórico */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Histórico</Text>
          {notificationHistory.length > 0 && (
            <TouchableOpacity onPress={clearHistory}>
              <Text style={styles.clearButton}>Limpar</Text>
            </TouchableOpacity>
          )}
        </View>

        {notificationHistory.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyStateText}>
              Nenhuma notificação recebida ainda
            </Text>
          </View>
        ) : (
          notificationHistory.map((item) => (
            <View key={item.id} style={styles.historyItem}>
              <View style={styles.historyItemHeader}>
                <Text style={styles.historyItemTitle}>{item.title}</Text>
                <Text style={styles.historyItemTime}>
                  {formatTimestamp(item.timestamp)}
                </Text>
              </View>
              <Text style={styles.historyItemBody}>{item.body}</Text>
            </View>
          ))
        )}
      </View>

      {/* Configuração de Horário */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Configurar Horário</Text>
        <View style={styles.timePickerContainer}>
          <View style={styles.timePicker}>
            <Text style={styles.timeLabel}>Hora:</Text>
            <View style={styles.timeButtons}>
              <TouchableOpacity
                onPress={() =>
                  setSelectedHour((prev) => (prev > 0 ? prev - 1 : 23))
                }
                style={styles.timeButton}
              >
                <Text style={styles.timeButtonText}>-</Text>
              </TouchableOpacity>
              <Text style={styles.timeValue}>
                {selectedHour.toString().padStart(2, "0")}
              </Text>
              <TouchableOpacity
                onPress={() =>
                  setSelectedHour((prev) => (prev < 23 ? prev + 1 : 0))
                }
                style={styles.timeButton}
              >
                <Text style={styles.timeButtonText}>+</Text>
              </TouchableOpacity>
            </View>
          </View>

          <Text style={styles.timeSeparator}>:</Text>

          <View style={styles.timePicker}>
            <Text style={styles.timeLabel}>Minuto:</Text>
            <View style={styles.timeButtons}>
              <TouchableOpacity
                onPress={() =>
                  setSelectedMinute((prev) => (prev > 0 ? prev - 15 : 45))
                }
                style={styles.timeButton}
              >
                <Text style={styles.timeButtonText}>-</Text>
              </TouchableOpacity>
              <Text style={styles.timeValue}>
                {selectedMinute.toString().padStart(2, "0")}
              </Text>
              <TouchableOpacity
                onPress={() =>
                  setSelectedMinute((prev) => (prev < 45 ? prev + 15 : 0))
                }
                style={styles.timeButton}
              >
                <Text style={styles.timeButtonText}>+</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>

        <TouchableOpacity
          style={styles.primaryButton}
          onPress={handleScheduleAtTime}
        >
          <Text style={styles.primaryButtonText}>
            Agendar para {selectedHour}:{selectedMinute.toString().padStart(2, "0")}
          </Text>
        </TouchableOpacity>
      </View>

      {/* Ações Rápidas */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Ações Rápidas</Text>
        
        <TouchableOpacity
          style={styles.actionButton}
          onPress={handleImmediateNotification}
        >
          <View style={styles.actionButtonContent}>
            <Text style={styles.actionButtonTitle}>Testar Notificação</Text>
            <Text style={styles.actionButtonSubtitle}>
              Receber uma notificação imediata
            </Text>
          </View>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.actionButton}
          onPress={handleRecurringNotifications}
        >
          <View style={styles.actionButtonContent}>
            <Text style={styles.actionButtonTitle}>Lembretes a cada 1h</Text>
            <Text style={styles.actionButtonSubtitle}>
              Notificações recorrentes a cada hora
            </Text>
          </View>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.actionButton}
          onPress={handleMultipleNotifications}
        >
          <View style={styles.actionButtonContent}>
            <Text style={styles.actionButtonTitle}>Lembretes a cada 2h</Text>
            <Text style={styles.actionButtonSubtitle}>
              Das 8h às 22h (recomendado)
            </Text>
          </View>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.actionButton, styles.dangerButton]}
          onPress={handleCancelAll}
        >
          <View style={styles.actionButtonContent}>
            <Text style={[styles.actionButtonTitle, styles.dangerText]}>
              Cancelar Todos
            </Text>
            <Text style={styles.actionButtonSubtitle}>
              Remove todos os lembretes agendados
            </Text>
          </View>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f0e3f7ff",
  },
  header: {
    backgroundColor: "#f0e3f7ff",
    padding: 20,
    paddingTop: Platform.OS === "ios" ? 60 : 40,
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
  },
  headerTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 20,
  },
  welcomeText: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#000",
  },
  subtitle: {
    fontSize: 14,
    color: "#000",
    marginTop: 4,
  },
  signOutButton: {
    backgroundColor: "#994cc5ff",
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  signOutText: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "600",
  },
  statsCard: {
    backgroundColor: "#fff",
    borderRadius: 20,
    padding: 20,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
  },
  statsIcon: {
    fontSize: 40,
    marginBottom: 8,
  },
  statsNumber: {
    fontSize: 36,
    fontWeight: "bold",
    color: "#994cc5ff",
  },
  statsLabel: {
    fontSize: 14,
    color: "#64748b",
    marginTop: 4,
  },
  section: {
    padding: 10,
  },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 10,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#0f172a",
    marginBottom: 16,
  },
  timePickerContainer: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
    flexWrap: "wrap",
  },
  timePicker: {
    alignItems: "center",
    flex: 1,
    minWidth: 120,
  },
  timeLabel: {
    fontSize: 12,
    color: "#64748b",
    marginBottom: 8,
  },
  timeButtons: {
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    gap: 12,
  },
  timeButton: {
    backgroundColor: "#994cc5ff",
    width: 36,
    height: 36,
    borderRadius: 5,
    justifyContent: "center",
    alignItems: "center",
  },
  timeButtonText: {
    color: "#fff",
    fontSize: 20,
    fontWeight: "bold",
    lineHeight: 20,
    textAlign: "center",
    includeFontPadding: false,
  },
  timeValue: {
    fontSize: 28,
    fontWeight: "bold",
    color: "#994cc5ff",
    minWidth: 50,
    textAlign: "center",
  },
  timeSeparator: {
    fontSize: 28,
    fontWeight: "bold",
    color: "#994cc5ff",
    marginHorizontal: 4,
  },
  primaryButton: {
    backgroundColor: "#994cc5ff",
    borderRadius: 12,
    padding: 16,
    alignItems: "center",
    shadowColor: "#994cc5ff",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  primaryButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "bold",
  },
  actionButton: {
    flexDirection: "row",
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  actionButtonIcon: {
    fontSize: 32,
    marginRight: 16,
  },
  actionButtonContent: {
    flex: 1,
  },
  actionButtonTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#0f172a",
    marginBottom: 4,
  },
  actionButtonSubtitle: {
    fontSize: 13,
    color: "#64748b",
  },
  dangerButton: {
    backgroundColor: "#fff",
  },
  dangerText: {
    color: "#dc2626",
  },
  clearButton: {
    color: "#994cc5ff",
    fontSize: 14,
    fontWeight: "600",
  },
  historyItem: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderLeftWidth: 4,
    borderLeftColor: "#994cc5ff",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  historyItemHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  historyItemTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#0f172a",
    flex: 1,
  },
  historyItemTime: {
    fontSize: 12,
    color: "#64748b",
  },
  historyItemBody: {
    fontSize: 14,
    color: "#64748b",
  },
  emptyState: {
    alignItems: "center",
    padding: 40,
    backgroundColor: "#fff",
    borderRadius: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  emptyStateIcon: {
    fontSize: 48,
    marginBottom: 12,
  },
  emptyStateText: {
    fontSize: 14,
    color: "#64748b",
    textAlign: "center",
  },
  footer: {
    padding: 20,
    paddingBottom: 40,
  },
  footerText: {
    fontSize: 14,
    color: "#64748b",
    textAlign: "center",
    backgroundColor: "#fff",
    padding: 16,
    borderRadius: 12,
  },
});
