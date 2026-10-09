import type { QueryClient } from "@tanstack/react-query";

import {
  fetchCatalogItems,
  fetchInvoicesList,
  fetchServicesList,
  fetchUsersList,
} from "@/lib/query-fetchers";
import { queryKeys, STALE } from "@/lib/query-keys";

/** Warm shared list caches after login / shell mount (admin). */
export function prefetchAdminDashboardLists(queryClient: QueryClient) {
  void queryClient.prefetchQuery({
    queryKey: queryKeys.servicesList,
    queryFn: fetchServicesList,
    staleTime: STALE.listsMs,
  });
  void queryClient.prefetchQuery({
    queryKey: queryKeys.invoicesList,
    queryFn: fetchInvoicesList,
    staleTime: STALE.listsMs,
  });
  void queryClient.prefetchQuery({
    queryKey: queryKeys.usersList,
    queryFn: fetchUsersList,
    staleTime: STALE.referenceMs,
  });
  void queryClient.prefetchQuery({
    queryKey: queryKeys.catalogItemsActive,
    queryFn: () => fetchCatalogItems(false),
    staleTime: STALE.referenceMs,
  });
}
