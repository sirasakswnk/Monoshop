<template>
  <div class="container orders-page-admin mt-4">
    <h2 class="page-title-admin">จัดการคำสั่งซื้อ (Admin)</h2>

    <!-- Loading -->
    <div v-if="loading" class="state-card state-loading">
      กำลังโหลดข้อมูล...
    </div>

    <!-- Error -->
    <div v-else-if="errorMessage" class="state-card state-error">
      {{ errorMessage }}
    </div>

    <!-- ไม่ใช่ admin -->
    <div v-else-if="!isAdmin" class="state-card state-warning">
      คุณไม่มีสิทธิ์เข้าถึงหน้านี้
    </div>

    <!-- แสดงรายการคำสั่งซื้อ -->
    <div v-else>
      <div
        v-for="order in orders"
        :key="order.orderId"
        class="order-card-admin"
      >
        <!-- HEADER -->
        <div class="order-header">
          <div class="order-left">
            <div class="order-meta-top">
              <span class="order-row">#{{ order.row_number }}</span>
              <span class="order-cus">ลูกค้า: {{ order.cusId }}</span>
            </div>
            <div class="order-title">
              คำสั่งซื้อเลขที่ {{ order.orderId }}
            </div>
            <div class="order-date">
              วันที่สั่งซื้อ: {{ formattedDate(order.orderDate) }}
            </div>
          </div>

          <div class="order-right">
            <div class="order-total-block">
              <div class="order-total-label">ยอดรวม</div>
              <div class="order-total">
                ฿{{ (order.totalPrice ?? 0).toLocaleString() }}
              </div>
            </div>

            <div class="order-qty-block">
              <span class="qty-pill">
                {{ (order.totalQty ?? 0) }} ชิ้น
              </span>
            </div>

            <span :class="['status-badge', getStatusClass(order.orderStatus)]">
              {{ getStatusText(order.orderStatus) }}
            </span>

            <button
              class="toggle-btn"
              @click="toggleOrderDetail(order.orderId)"
              :title="expandedOrders.includes(order.orderId) ? 'ซ่อนรายละเอียด' : 'ดูรายละเอียด'"
            >
              <i
                :class="expandedOrders.includes(order.orderId)
                  ? 'bi bi-chevron-up'
                  : 'bi bi-chevron-down'"
              ></i>
            </button>
          </div>
        </div>

        <!-- ACTIONS สำหรับ Admin -->
        <div class="admin-actions admin-actions-right">
          <button
            class="admin-btn admin-btn-confirm"
            :disabled="order.orderStatus === 'confirmed'"
            @click="updateStatus(order.orderId, 'confirmed')"
          >
            <i class="bi bi-check2-circle me-1"></i> ตกลง
          </button>
          <button
            class="admin-btn admin-btn-danger"
            @click="deleteOrder(order.orderId)"
          >
            <i class="bi bi-trash3 me-1"></i> ลบคำสั่งซื้อ
          </button>
        </div>

        <!-- DETAILS (EXPANDABLE) -->
        <transition name="fade">
          <div
            v-if="expandedOrders.includes(order.orderId)"
            class="order-details-admin"
          >
            <div class="detail-title">
              รายละเอียดสินค้า
            </div>

            <div v-if="orderDetails[order.orderId]" class="detail-table-admin">
              <!-- Header row -->
              <div class="detail-header-row">
                <div>#</div>
                <div>สินค้า</div>
                <div class="text-center">จำนวน</div>
                <div class="text-end">ราคาต่อหน่วย</div>
                <div class="text-end">รวม</div>
              </div>

              <!-- Data rows -->
              <div
                v-for="detail in orderDetails[order.orderId]"
                :key="detail.row_number"
                class="detail-row-admin"
              >
                <div class="d-index">
                  {{ detail.row_number }}
                </div>

                <div class="d-name">
                  <div class="prod-name">{{ detail.productname }}</div>
                  <div class="prod-meta">รหัส: {{ detail.pdId }}</div>
                </div>

                <div class="d-qty text-center">
                  <span class="qty-highlight">{{ detail.qty }} ชิ้น</span>
                </div>

                <div class="d-price text-end">
                  ฿{{ detail.price.toLocaleString() }}
                </div>

                <div class="d-total text-end">
                  ฿{{ (detail.qty * detail.price).toLocaleString() }}
                </div>
              </div>
            </div>

            <div v-else class="text-center text-muted py-3">
              กำลังโหลดรายละเอียด...
            </div>
          </div>
        </transition>
      </div>
    </div>
  </div>
</template>


<script setup>
import { onMounted, ref } from "vue";
import axios from "axios";
import API_BASE_URL from '@/config/api';

axios.defaults.withCredentials = true;

const orders = ref([]);
const orderDetails = ref({});
const expandedOrders = ref([]);
const loading = ref(true);
const isAdmin = ref(false);
const errorMessage = ref("");

const formattedDate = (dateStr) => {
    const date = new Date(dateStr);
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
};

const getStatusText = (status) => {
    const map = {
        pending: "รอดำเนินการ",
        confirmed: "ยืนยันแล้ว",
        shipped: "จัดส่งแล้ว",
        delivered: "จัดส่งสำเร็จ",
        cancelled: "ยกเลิก",
    };
    return map[status] || status;
};

const getStatusClass = (status) => {
  const classMap = {
    pending: "status-badge status-pending",
    confirmed: "status-badge status-confirmed",
    shipped: "status-badge status-shipped",
    delivered: "status-badge status-delivered",
    cancelled: "status-badge status-cancelled",
  };
  return classMap[status] || "status-badge status-default";
};

const getMember = async () => {
    try {
        const response = await axios.get(`${API_BASE_URL}/members/detail`);
        if (response.data.login && response.data.role === "admin") {
            isAdmin.value = true;
        } else {
            isAdmin.value = false;
            errorMessage.value = "ต้องเป็นผู้ดูแลระบบเท่านั้น";
        }
    } catch (err) {
        console.error("Error getting member:", err.message);
        errorMessage.value = "ไม่สามารถตรวจสอบสิทธิ์ได้";
        isAdmin.value = false;
    }
};

const getOrders = async () => {
    if (!isAdmin.value) {
        loading.value = false;
        return;
    }
    try {
        const response = await axios.get(`${API_BASE_URL}/orders/admin`);
        orders.value = response.data;
    } catch (err) {
        console.error("Error getting admin orders:", err);
        errorMessage.value = err.response?.data?.error || "ไม่สามารถโหลดข้อมูลได้";
    } finally {
        loading.value = false;
    }
};

const toggleOrderDetail = async (orderId) => {
    const idx = expandedOrders.value.indexOf(orderId);
    if (idx > -1) {
        expandedOrders.value.splice(idx, 1);
        return;
    }
    expandedOrders.value.push(orderId);
    if (!orderDetails.value[orderId]) {
        await getOrderDetail(orderId);
    }
};

const getOrderDetail = async (orderId) => {
    try {
        const response = await axios.get(`${API_BASE_URL}/orders/detail/${orderId}`);
        orderDetails.value[orderId] = response.data;
    } catch (err) {
        console.error("Error loading order detail:", err);
    }
};

const updateStatus = async (orderId, status) => {
    if (!confirm("ยืนยันการอัปเดตสถานะ?")) {
        return;
    }
    try {
        await axios.put(`${API_BASE_URL}/orders/${orderId}/status`, { status });
        await getOrders();
        alert("อัปเดตสถานะสำเร็จ");
    } catch (err) {
        console.error("Error updating status:", err);
        alert(err.response?.data?.error || "อัปเดตสถานะไม่สำเร็จ");
    }
};

const deleteOrder = async (orderId) => {
    if (!confirm("ต้องการลบคำสั่งซื้อนี้หรือไม่?")) {
        return;
    }
    try {
        await axios.delete(`${API_BASE_URL}/orders/${orderId}`);
        await getOrders();
        alert("ลบคำสั่งซื้อสำเร็จ");
    } catch (err) {
        console.error("Error deleting order:", err);
        alert(err.response?.data?.error || "ลบคำสั่งซื้อไม่สำเร็จ");
    }
};

onMounted(async () => {
    await getMember();
    if (isAdmin.value) {
        await getOrders();
    } else {
        loading.value = false;
    }
});
</script>

<style scoped lang="scss">
.orders-page-admin {
  padding-bottom: 2rem;
}

.page-title-admin {
  font-size: 1.35rem;
  font-weight: 700;
  color: #4c1d95;
  margin-bottom: 1.5rem;
}

/* state card (loading, error, no permission) */
.state-card {
  border-radius: 1rem;
  padding: 1rem 1.25rem;
  font-weight: 500;
}

.state-loading {
  background: #f3f4ff;
  color: #4c1d95;
}

.state-error {
  background: #fef2f2;
  color: #b91c1c;
}

.state-warning {
  background: #fef9c3;
  color: #92400e;
}

/* ORDER CARD */
.order-card-admin {
  background: #ffffff;
  border-radius: 1.1rem;
  padding: 1.1rem 1.3rem 1.1rem;
  margin-bottom: 1rem;
  border: 1px solid #e5e7eb;
  box-shadow: 0 1px 3px rgba(15, 23, 42, 0.06);
  transition: 0.22s ease;
}

.order-card-admin:hover {
  box-shadow: 0 6px 20px rgba(15, 23, 42, 0.12);
}

/* HEADER */
.order-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 1rem;
}

.order-left {
  display: flex;
  flex-direction: column;
  gap: 0.1rem;
}

.order-meta-top {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.85rem;
  color: #6b7280;
}

.order-row {
  font-weight: 600;
  color: #4b5563;
}

.order-cus {
  padding-inline: 0.5rem;
  padding-block: 0.1rem;
  border-radius: 999px;
  background: #f3e8ff;
  color: #6d28d9;
  font-size: 0.8rem;
}

.order-title {
  font-size: 1rem;
  font-weight: 600;
  color: #111827;
}

.order-date {
  font-size: 0.85rem;
  color: #9ca3af;
}

/* RIGHT SECTION */
.order-right {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.order-total-block {
  text-align: right;
}

.order-total-label {
  font-size: 0.75rem;
  color: #9ca3af;
}

.order-total {
  font-size: 1.25rem;
  font-weight: 700;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
}

.order-qty-block {
  min-width: 90px;
  text-align: center;
}

.qty-pill {
  background: #eef2ff;
  color: #4f46e5;
  border-radius: 999px;
  padding: 0.25rem 0.8rem;
  font-size: 0.8rem;
  font-weight: 600;
}

/* Status badge */
.status-badge {
  padding: 0.35rem 0.7rem;
  border-radius: 999px;
  font-size: 0.75rem;
  font-weight: 600;
  text-transform: uppercase;
}

.status-pending {
  background: #fef9c3;
  color: #b45309;
}

.status-confirmed {
  background: #e0f2fe;
  color: #03a10e;
}

.status-shipped {
  background: #ede9fe;
  color: #5b21b6;
}

.status-delivered {
  background: #dcfce7;
  color: #166534;
}

.status-cancelled {
  background: #fee2e2;
  color: #b91c1c;
}

.status-default {
  background: #e5e7eb;
  color: #374151;
}

/* Toggle button */
.toggle-btn {
  border: none;
  background: transparent;
  font-size: 1.1rem;
  color: #6b7280;
  cursor: pointer;
  transition: 0.2s;
}

.toggle-btn:hover {
  color: #4c1d95;
}

/* ADMIN ACTIONS */
.admin-actions-right {
  display: flex;
  justify-content: flex-end;   /* ชิดขวา */
  gap: 0.6rem;
  margin-top: 0.85rem;
}


.admin-btn {
  border-radius: 999px;
  border: none;
  padding: 0.3rem 0.9rem;
  font-size: 0.8rem;
  font-weight: 600;
  display: inline-flex;
  align-items: center;
  gap: 0.25rem;
  cursor: pointer;
  transition: 0.2s ease;
}

.admin-btn-confirm {
  background: #22c55e;
  color: #f9fafb;
}

.admin-btn-confirm:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.admin-btn-confirm:not(:disabled):hover {
  background: #16a34a;
}

.admin-btn-danger {
  background: #fee2e2;
  color: #b91c1c;
}

.admin-btn-danger:hover {
  background: #fecaca;
}

/* DETAILS SECTION */
.order-details-admin {
  margin-top: 1rem;
  background: linear-gradient(90deg, #1e004c 0%, #783a84 100%);
  padding: 1rem;
  border-radius: 0.9rem;
  border: 1px solid #ede9fe;
}

.detail-title {
  font-size: 0.9rem;
  font-weight: 600;
  color: #f9fafb;
  margin-bottom: 0.75rem;
}

/* Detail table as flex/rows */
.detail-table-admin {
  display: flex;
  flex-direction: column;
  gap: 0.4rem;
}

/* header row */
.detail-header-row {
  display: grid;
  grid-template-columns: 0.4fr 1.6fr 0.8fr 0.9fr 1fr;
  font-size: 0.78rem;
  text-transform: uppercase;
  letter-spacing: 0.06em;
  color: #e5e7eb;
  margin-bottom: 0.2rem;
}

/* data row */
.detail-row-admin {
  display: grid;
  grid-template-columns: 0.4fr 1.6fr 0.8fr 0.9fr 1fr;
  padding: 0.6rem 0.5rem;
  background: #ffffff;
  border-radius: 0.6rem;
  border: 1px solid #f3e8ff;
  column-gap: 0.5rem;
}

.detail-row-admin div {
  font-size: 0.86rem;
  color: #4b5563;
}

.d-index {
  font-weight: 600;
  color: #6b7280;
}

.d-name .prod-name {
  font-weight: 600;
}

.d-name .prod-meta {
  font-size: 0.78rem;
  color: #9ca3af;
}

/* qty highlight (เหมือนฝั่ง customer) */
.qty-highlight {
  background: #f3e8ff;
  color: #6d28d9;
  font-weight: 600;
  padding: 0.2rem 0.6rem;
  border-radius: 0.9rem;
  font-size: 0.8rem;
  display: inline-block;
}

.d-total {
  font-weight: 700;
  color: #6d28d9;
}

/* fade animation */
.fade-enter-active,
.fade-leave-active {
  transition: all 0.25s ease;
}
.fade-enter-from,
.fade-leave-to {
  opacity: 0;
  transform: translateY(-5px);
}
</style>
