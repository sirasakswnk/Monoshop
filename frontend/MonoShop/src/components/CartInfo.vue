<template>
    <div class="cart-info-icon">
        <button
            class="icon-btn position-relative"
            @click="goToCart"
            title="ดูตะกร้าสินค้า"
        >
            <i class="bi bi-bag"></i>
            <span v-if="qty > 0" class="badge-count">{{ qty }}</span>
        </button>
    </div>
</template>
<script setup>
    import { onMounted, ref, watch, onUnmounted, computed } from 'vue';
    import axios from 'axios';
    import API_BASE_URL from '@/config/api';
    axios.defaults.withCredentials = true

    import { useRouter, useRoute } from "vue-router";
    const router = useRouter();
    const route = useRoute();
    import { useCartStore } from '@/stores/cartStore';
    import { storeToRefs } from 'pinia';
    const cartStore = useCartStore()
    const { cartId: cartIdRef, displayQty } = storeToRefs(cartStore)


    const mem_email=ref(null)
    const money=ref(0)
    const id=ref(null)
    
    const qty = computed(() => displayQty.value)
    const goToCart = () => {
        if (cartIdRef.value) {
            router.push(`/cartShow/${cartIdRef.value}`)
        } else {
            alert('คุณยังไม่มีสินค้าในตะกร้า')
        }
    }

    const refreshCart = async () => {
        await getMember()
        await chkCart()
        if (cartIdRef.value) {
            await sumCart(cartIdRef.value)
        } else {
            money.value = 0
            cartStore.setDisplayQty(0)
        }
    }
    
    watch(()=>cartStore.theQty,(newValue,oldValue)=>{
        id.value=cartIdRef.value
        if (id.value) {
            sumCart(id.value)
        }
    })
    
    watch(() => route.path, async (newPath) => {
        if (newPath === '/product' || newPath === '/') {
            await refreshCart()
        }
    })
    
    const handleCartDeleted = async () => {
        await refreshCart()
    }
    
    const handleCartItemDeleted = async () => {
        await refreshCart()
    }
    
    onMounted(async ()=>{
        await refreshCart()
        window.addEventListener('cart-deleted', handleCartDeleted)
        window.addEventListener('cart-item-deleted', handleCartItemDeleted)
    })
    
    onUnmounted(() => {
        window.removeEventListener('cart-deleted', handleCartDeleted)
        window.removeEventListener('cart-item-deleted', handleCartItemDeleted)
    })
    
    const chkCart=async ()=>{
        let members={ mem_email:mem_email.value }
        try {
                const response = await axios.post(`${API_BASE_URL}/carts/chkcart`,members)
                
                if (response.data.cartExists && response.data.cartId) {
                    cartIdRef.value = response.data.cartId
                    cartStore.setId(response.data.cartId)
                } else {
                    cartIdRef.value = null
                    money.value = 0
                    cartStore.setDisplayQty(0)
                }
        }
        catch(err){
            cartIdRef.value = null
            money.value = 0
            cartStore.setDisplayQty(0)
        }                
    }
    
    const getMember=async ()=>{
        await axios.get(`${API_BASE_URL}/members/detail`)
            .then((res)=>{
                mem_email.value=res.data.mem_email
            })
            .catch(err=>{})
    }
    
    const sumCart=async(cid)=>{
        await axios.get(`${API_BASE_URL}/carts/sumcart/${cid}`)
        .then(res => {
            cartIdRef.value = res.data.id
            cartStore.setId(res.data.id)
            const sumQty = Number(res.data.qty) || 0
            money.value = res.data.money
            cartStore.setDisplayQty(sumQty)
        })
        .catch(err => {});
    }
</script>
<style scoped>
.icon-btn {
    width: 38px;
    height: 38px;
    display: grid;
    place-items: center;
    border-radius: 10px;
    border: 1px solid rgba(46, 125, 50, 0.15);
    background: #fff;
    color: #5a32a3;
    transition: all 0.15s ease;
}

.icon-btn:hover {
    color: #fff;
    background: #5a32a3;
    border-color: #5a32a3;
}

.badge-count {
    position: absolute;
    top: -4px;
    right: -6px;
    font-size: 0.7rem;
    padding: 0.05rem 0.35rem;
    border-radius: 999px;
    background: #582e7d;
    color: #ffffff;
    border: 2px solid #fff;
}

.no-cart-text {
    margin: 0.25rem 0 0;
    font-size: 0.8rem;
    color: #6c757d;
}
</style>

