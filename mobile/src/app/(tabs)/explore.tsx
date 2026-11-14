import { useCallback, useEffect, useState } from "react";
import { router, useFocusEffect } from "expo-router";
import {
  FlatList,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { EmptyState, ErrorState, LoadingState } from "@/components/ScreenState";
import { api } from "@/lib/api";
import { formatDate, formatEventFormat, getEventStatus } from "@/lib/format";
import type { EventItem } from "@/lib/types";

type FormatFilter = "IN_PERSON" | "ONLINE" | "HYBRID";
type StatusFilter = "UPCOMING" | "ONGOING" | "ENDED";
type RegistrationFilter = "OPEN" | "FULL" | "CLOSED";

export default function ExploreScreen() {
  const [query, setQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const [events, setEvents] = useState<EventItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [reloadKey, setReloadKey] = useState(0);

  const [formatFilter, setFormatFilter] = useState<FormatFilter | undefined>(undefined);
  const [statusFilter, setStatusFilter] = useState<StatusFilter | undefined>(undefined);
  const [registrationFilter, setRegistrationFilter] = useState<RegistrationFilter | undefined>(undefined);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [draftFormat, setDraftFormat] = useState<FormatFilter | undefined>(undefined);
  const [draftStatus, setDraftStatus] = useState<StatusFilter | undefined>(undefined);
  const [draftRegistration, setDraftRegistration] = useState<RegistrationFilter | undefined>(undefined);

  const activeFilterCount = Number(formatFilter !== undefined) + Number(statusFilter !== undefined) + Number(registrationFilter !== undefined);
  const hasActiveFilter = activeFilterCount > 0;

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedQuery(query.trim()), 300);
    return () => clearTimeout(timer);
  }, [query]);

  useFocusEffect(
    useCallback(() => {
      let active = true;
      const requestVersion = reloadKey;
      async function load() {
        setLoading(true);
        setError(null);
        try {
          const activeFilters = {
            format: formatFilter,
            status: statusFilter,
            registration: registrationFilter,
          };
          const data = await api.events(debouncedQuery, activeFilters);
          if (active && requestVersion === reloadKey) setEvents(data);
        } catch (caught) {
          if (active)
            setError(
              caught instanceof Error
                ? caught.message
                : "Không thể tải sự kiện.",
            );
        } finally {
          if (active) setLoading(false);
        }
      }
      void load();
      return () => {
        active = false;
      };
    }, [debouncedQuery, reloadKey, formatFilter, statusFilter, registrationFilter]),
  );

  function clearFilters() {
    setFormatFilter(undefined);
    setStatusFilter(undefined);
    setRegistrationFilter(undefined);
  }

  function openFilters() {
    setDraftFormat(formatFilter);
    setDraftStatus(statusFilter);
    setDraftRegistration(registrationFilter);
    setFiltersOpen(true);
  }

  function applyFilters() {
    setFormatFilter(draftFormat);
    setStatusFilter(draftStatus);
    setRegistrationFilter(draftRegistration);
    setFiltersOpen(false);
  }

  function removeFilter(group: "format" | "status" | "registration") {
    if (group === "format") setFormatFilter(undefined);
    if (group === "status") setStatusFilter(undefined);
    if (group === "registration") setRegistrationFilter(undefined);
  }

  const emptyMessage = hasActiveFilter
    ? "Không có sự kiện nào khớp bộ lọc — thử thay đổi tiêu chí tìm kiếm."
    : query
    ? "Thử một từ khóa khác."
    : "Các sự kiện mới sẽ xuất hiện tại đây.";

  return (
    <SafeAreaView edges={["left", "right"]} style={styles.screen}>
      <SafeAreaView edges={["top"]} style={styles.header}>
        <View style={styles.headerContent}>
          <Text style={styles.eyebrow}>STUDENT EVENTS</Text>
          <Text style={styles.heading}>Khám phá sự kiện</Text>
          <View style={styles.searchRow}>
            <TextInput
              accessibilityLabel="Tìm sự kiện"
              placeholder="Tìm theo tên sự kiện…"
              placeholderTextColor="#94a3b8"
              value={query}
              onChangeText={setQuery}
              style={styles.search}
            />
            <Pressable accessibilityRole="button" accessibilityLabel={`Bộ lọc${activeFilterCount ? `, ${activeFilterCount} nhóm đang bật` : ""}`} onPress={openFilters} style={[styles.filterButton, hasActiveFilter && styles.filterButtonActive]}>
              <Text style={[styles.filterButtonText, hasActiveFilter && styles.filterButtonTextActive]}>{hasActiveFilter ? `Lọc · ${activeFilterCount}` : "Lọc"}</Text>
            </Pressable>
          </View>
        </View>
        {hasActiveFilter && <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.activeFilters}>
          {formatFilter && <ActiveFilter label={formatFilter === "IN_PERSON" ? "Trực tiếp" : formatFilter === "ONLINE" ? "Online" : "Kết hợp"} onRemove={() => removeFilter("format")} />}
          {statusFilter && <ActiveFilter label={statusFilter === "UPCOMING" ? "Sắp diễn ra" : statusFilter === "ONGOING" ? "Đang diễn ra" : "Đã kết thúc"} onRemove={() => removeFilter("status")} />}
          {registrationFilter && <ActiveFilter label={registrationFilter === "OPEN" ? "Còn chỗ" : registrationFilter === "FULL" ? "Hết chỗ" : "Đã đóng"} onRemove={() => removeFilter("registration")} />}
          <Pressable accessibilityRole="button" onPress={clearFilters} style={styles.clearAll}><Text style={styles.clearAllText}>Xóa hết</Text></Pressable>
        </ScrollView>}
      </SafeAreaView>
      <Modal visible={filtersOpen} transparent animationType="slide" onRequestClose={() => setFiltersOpen(false)}>
        <View style={styles.modalRoot}>
          <Pressable accessibilityRole="button" accessibilityLabel="Đóng bộ lọc" style={styles.backdrop} onPress={() => setFiltersOpen(false)} />
          <View style={styles.filterSheet}>
            <View style={styles.sheetHandle} />
            <View style={styles.sheetHeadingRow}>
              <View><Text style={styles.sheetTitle}>Bộ lọc</Text><Text style={styles.sheetSubtitle}>Kết hợp tiêu chí để tìm đúng sự kiện</Text></View>
              <View style={styles.sheetActions}>
                <Pressable accessibilityRole="button" onPress={() => { setDraftFormat(undefined); setDraftStatus(undefined); setDraftRegistration(undefined); }}><Text style={styles.resetText}>Đặt lại</Text></Pressable>
                <Pressable accessibilityRole="button" accessibilityLabel="Đóng bộ lọc" onPress={() => setFiltersOpen(false)} style={styles.closeButton}><Text style={styles.closeButtonText}>×</Text></Pressable>
              </View>
            </View>
            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.sheetOptions}>
              <FilterGroup title="Hình thức" description="Sự kiện kết hợp sẽ khớp cả hai lựa chọn.">
                <FilterOption label="Trực tiếp" selected={draftFormat === "IN_PERSON"} onPress={() => setDraftFormat(draftFormat === "IN_PERSON" ? undefined : "IN_PERSON")} />
                <FilterOption label="Trực tuyến" selected={draftFormat === "ONLINE"} onPress={() => setDraftFormat(draftFormat === "ONLINE" ? undefined : "ONLINE")} />
                <FilterOption label="Kết hợp" selected={draftFormat === "HYBRID"} onPress={() => setDraftFormat(draftFormat === "HYBRID" ? undefined : "HYBRID")} />
              </FilterGroup>
              <FilterGroup title="Thời gian">
                <FilterOption label="Sắp diễn ra" selected={draftStatus === "UPCOMING"} onPress={() => setDraftStatus(draftStatus === "UPCOMING" ? undefined : "UPCOMING")} />
                <FilterOption label="Đang diễn ra" selected={draftStatus === "ONGOING"} onPress={() => setDraftStatus(draftStatus === "ONGOING" ? undefined : "ONGOING")} />
                <FilterOption label="Đã kết thúc" selected={draftStatus === "ENDED"} onPress={() => setDraftStatus(draftStatus === "ENDED" ? undefined : "ENDED")} />
              </FilterGroup>
              <FilterGroup title="Đăng ký">
                <FilterOption label="Còn chỗ" selected={draftRegistration === "OPEN"} onPress={() => setDraftRegistration(draftRegistration === "OPEN" ? undefined : "OPEN")} />
                <FilterOption label="Đã hết chỗ" selected={draftRegistration === "FULL"} onPress={() => setDraftRegistration(draftRegistration === "FULL" ? undefined : "FULL")} />
                <FilterOption label="Đã đóng đăng ký" selected={draftRegistration === "CLOSED"} onPress={() => setDraftRegistration(draftRegistration === "CLOSED" ? undefined : "CLOSED")} />
              </FilterGroup>
            </ScrollView>
            <Pressable accessibilityRole="button" onPress={applyFilters} style={styles.applyButton}>
              <Text style={styles.applyButtonText}>{activeDraftCount(draftFormat, draftStatus, draftRegistration) ? `Áp dụng ${activeDraftCount(draftFormat, draftStatus, draftRegistration)} nhóm lọc` : "Hiện tất cả sự kiện"}</Text>
            </Pressable>
          </View>
        </View>
      </Modal>
      {loading ? (
        <LoadingState label="Đang tải sự kiện…" />
      ) : error ? (
        <ErrorState
          message={error}
          onRetry={() => setReloadKey((value) => value + 1)}
        />
      ) : (
        <FlatList
          contentContainerStyle={events.length ? styles.list : styles.empty}
          data={events}
          keyExtractor={(item) => item.id}
          ListEmptyComponent={
            <EmptyState
              title="Không tìm thấy sự kiện"
              message={emptyMessage}
            />
          }
          renderItem={({ item }) => (
            <Pressable
              accessibilityHint="Mở thông tin chi tiết của sự kiện"
              accessibilityRole="button"
              onPress={() =>
                router.navigate({
                  pathname: "/events/[id]",
                  params: { id: item.id },
                })
              }
              style={({ pressed }) => [
                styles.card,
                pressed && styles.cardPressed,
              ]}
            >
              <View style={styles.titleRow}>
                <Text style={styles.cardTitle}>{item.title}</Text>
                {getEventStatus(item) && (
                  <Text
                    style={[styles.statusBadge, styles[getEventStatus(item)!]]}
                  >
                    {getEventStatus(item) === "expired"
                      ? "Đã hết hạn"
                      : getEventStatus(item) === "ongoing"
                        ? "Đang diễn ra"
                        : "Mới"}
                  </Text>
                )}
              </View>
              <Text style={styles.meta}>{formatDate(item.startsAt)}</Text>
              <Text style={styles.meta}>📍 {item.location}</Text>
              <Text style={styles.meta}>{formatEventFormat(item.format)}</Text>
              <View style={styles.slotRow}>
                <Text style={styles.meta}>
                  {`Còn ${item.remainingSlots}/${item.capacity} chỗ`}
                  {item.remainingSlots <= 0 ? " · Đã đủ chỗ" : ""}
                  {item.registrationDeadline
                    ? ` · Hạn đăng ký ${formatDate(item.registrationDeadline)}`
                    : ""}
                </Text>
              </View>
              <Text numberOfLines={2} style={styles.description}>
                {item.description}
              </Text>
            </Pressable>
          )}
        />
      )}
    </SafeAreaView>
  );
}

function activeDraftCount(format: FormatFilter | undefined, status: StatusFilter | undefined, registration: RegistrationFilter | undefined) {
  return Number(format !== undefined) + Number(status !== undefined) + Number(registration !== undefined);
}

function ActiveFilter({ label, onRemove }: { label: string; onRemove: () => void }) {
  return <Pressable accessibilityRole="button" accessibilityLabel={`Bỏ lọc ${label}`} onPress={onRemove} style={styles.activeChip}>
    <Text style={styles.activeChipText}>{label}  ×</Text>
  </Pressable>;
}

function FilterGroup({ title, description, children }: { title: string; description?: string; children: React.ReactNode }) {
  return <View style={styles.filterGroup}>
    <Text style={styles.filterGroupTitle}>{title}</Text>
    {description && <Text style={styles.filterGroupDescription}>{description}</Text>}
    <View style={styles.optionGrid}>{children}</View>
  </View>;
}

function FilterOption({ label, selected, onPress }: { label: string; selected: boolean; onPress: () => void }) {
  return <Pressable accessibilityRole="button" accessibilityState={{ selected }} onPress={onPress} style={[styles.option, selected && styles.optionSelected]}>
    <Text style={[styles.optionText, selected && styles.optionTextSelected]}>{selected ? "✓  " : ""}{label}</Text>
  </Pressable>;
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: "#f5f7fb" },
  header: { backgroundColor: "#1e3a8a" },
  headerContent: { paddingHorizontal: 20, paddingVertical: 16 },
  eyebrow: {
    color: "#bfdbfe",
    fontSize: 12,
    fontWeight: "700",
    letterSpacing: 1.5,
  },
  heading: {
    color: "#fff",
    fontSize: 28,
    fontWeight: "800",
    marginBottom: 14,
    marginTop: 4,
  },
  searchRow: { alignItems: "center", flexDirection: "row", gap: 9 },
  search: {
    flex: 1,
    minWidth: 0,
    backgroundColor: "#fff",
    borderRadius: 12,
    color: "#0f172a",
    fontSize: 16,
    paddingHorizontal: 14,
    paddingVertical: 11,
  },
  filterButton: {
    alignItems: "center",
    backgroundColor: "rgba(255,255,255,0.14)",
    borderColor: "rgba(255,255,255,0.35)",
    borderRadius: 12,
    borderWidth: 1,
    justifyContent: "center",
    minHeight: 44,
    minWidth: 62,
    paddingHorizontal: 12,
  },
  filterButtonActive: { backgroundColor: "#dbeafe", borderColor: "#dbeafe" },
  filterButtonText: { color: "#fff", fontSize: 13, fontWeight: "800" },
  filterButtonTextActive: { color: "#1e3a8a" },
  activeFilters: {
    alignItems: "center",
    flexDirection: "row",
    gap: 7,
    paddingBottom: 12,
    paddingHorizontal: 16,
    paddingTop: 2,
  },
  activeChip: { backgroundColor: "#dbeafe", borderRadius: 20, paddingHorizontal: 11, paddingVertical: 7 },
  activeChipText: { color: "#1e3a8a", fontSize: 12, fontWeight: "700" },
  clearAll: { paddingHorizontal: 8, paddingVertical: 7 },
  clearAllText: { color: "#bfdbfe", fontSize: 12, fontWeight: "700" },
  modalRoot: { flex: 1, justifyContent: "flex-end" },
  backdrop: { ...StyleSheet.absoluteFill, backgroundColor: "rgba(15,23,42,0.5)" },
  filterSheet: {
    backgroundColor: "#fff",
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: "82%",
    paddingBottom: 26,
    paddingHorizontal: 20,
    paddingTop: 10,
  },
  sheetHandle: { alignSelf: "center", backgroundColor: "#cbd5e1", borderRadius: 99, height: 4, marginBottom: 17, width: 38 },
  sheetHeadingRow: { alignItems: "center", flexDirection: "row", justifyContent: "space-between", marginBottom: 8 },
  sheetActions: { alignItems: "center", flexDirection: "row", gap: 8 },
  closeButton: { alignItems: "center", backgroundColor: "#f1f5f9", borderRadius: 20, height: 36, justifyContent: "center", width: 36 },
  closeButtonText: { color: "#334155", fontSize: 25, fontWeight: "500", lineHeight: 29 },
  sheetTitle: { color: "#172554", fontSize: 22, fontWeight: "800" },
  sheetSubtitle: { color: "#64748b", fontSize: 13, marginTop: 3 },
  resetText: { color: "#1d4ed8", fontSize: 13, fontWeight: "800", padding: 8 },
  sheetOptions: { gap: 20, paddingBottom: 16, paddingTop: 12 },
  filterGroup: { gap: 10 },
  filterGroupTitle: { color: "#334155", fontSize: 14, fontWeight: "800" },
  filterGroupDescription: { color: "#64748b", fontSize: 12, marginTop: -6 },
  optionGrid: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  option: { backgroundColor: "#f1f5f9", borderColor: "#e2e8f0", borderRadius: 12, borderWidth: 1, paddingHorizontal: 13, paddingVertical: 10 },
  optionSelected: { backgroundColor: "#eff6ff", borderColor: "#2563eb" },
  optionText: { color: "#475569", fontSize: 13, fontWeight: "600" },
  optionTextSelected: { color: "#1d4ed8", fontWeight: "800" },
  applyButton: { alignItems: "center", backgroundColor: "#1d4ed8", borderRadius: 12, marginTop: 10, minHeight: 50, justifyContent: "center" },
  applyButtonText: { color: "#fff", fontSize: 14, fontWeight: "800" },
  list: { padding: 16, gap: 14 },
  empty: { flexGrow: 1 },
  card: {
    backgroundColor: "#fff",
    borderColor: "#dbe3f0",
    borderRadius: 16,
    borderWidth: 1,
    elevation: 2,
    padding: 18,
    shadowColor: "#172554",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
  },
  cardTitle: {
    color: "#172554",
    flex: 1,
    flexShrink: 1,
    fontSize: 18,
    fontWeight: "700",
  },
  titleRow: {
    alignItems: "flex-start",
    flexDirection: "row",
    flexWrap: "nowrap",
    gap: 8,
    minWidth: 0,
    width: "100%",
  },
  slotRow: {
    alignItems: "center",
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    justifyContent: "space-between",
  },
  statusBadge: {
    borderRadius: 99,
    flexShrink: 0,
    fontSize: 10,
    fontWeight: "800",
    overflow: "hidden",
    paddingHorizontal: 8,
    paddingVertical: 5,
  },
  expired: { backgroundColor: "#f1f5f9", color: "#64748b" },
  ongoing: { backgroundColor: "#dcfce7", color: "#15803d" },
  new: { backgroundColor: "#dbeafe", color: "#1d4ed8" },
  cardPressed: { opacity: 0.75 },
  meta: { color: "#475569", fontSize: 14, marginTop: 7 },
  description: { color: "#64748b", fontSize: 14, lineHeight: 20, marginTop: 8 },
});
