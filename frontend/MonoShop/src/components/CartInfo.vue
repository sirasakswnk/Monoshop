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
        <!--<p v-if="!cartId" class="no-cart-text">คุณยังไม่มีสินค้าในตะกร้า</p>-->
    </div>
</template>
<script setup>
    import { onMounted, ref, watch, onUnmounted, computed } from 'vue'; // import function ref มาจาก vue
    import axios from 'axios';
    axios.defaults.withCredentials = true


    import { useRouter, useRoute } from "vue-router" // เพื่อกำหนดให้ใช้ย้ายหน้า
    const router = useRouter();
    const route = useRoute();
    import { useCartStore } from '@/stores/cartStore';
    const cartStore = useCartStore()


    const mem_email=ref(null) //ข้อมูลผู้ที่ Login อยู่อ่านจาก Cookie getMember()
    const cartId=ref() //ตะกร้าที่ยังไม่ได้ CF ค่าที่ได้รับจาก chkCart()
    const money=ref(0) //ค่าที่ได้รับจาก sumCart()
    const id=ref(null) //ค่ารหัสของตะกร้าที่ได้จาก Store เมื่อจำนวนสินค้าเปลี่ยนไป
    
    // ใช้ computed จาก cartStore.displayQty เพื่อให้อัพเดตแบบ real-time
    const qty = computed(() => cartStore.displayQty)
    const goToCart = () => {
        if (cartId.value) {
            router.push(`/cartShow/${cartId.value}`)
        } else {
            alert('คุณยังไม่มีสินค้าในตะกร้า')
        }
    }

    // ฟังก์ชันสำหรับ refresh ข้อมูลตะกร้า
    const refreshCart = async () => {
        await getMember()
        await chkCart()
        if (cartId.value) {
            await sumCart(cartId.value)
        } else {
            // ถ้าไม่มี cartId ให้ reset ค่า
            money.value = 0
            cartStore.setDisplayQty(0)
        }
    }
    
    // Watch ว่ามีการเปลี่ยนแปลง Qty ใน cartStore หรือไม่
    watch(()=>cartStore.theQty,(newValue,oldValue)=>{
        id.value=cartStore.cartId // ถ้ามีการเปลี่ยนแปลงค่าใน Store ก็ทำการอ่านรหัส Cart
        console.log("Watch Cart:" +id.value)
        if (id.value) {
            sumCart(id.value) // แล้วส่งให้ Backend คำนวนค่าใหม่
        }
    })
    
    // Watch route เพื่อ refresh เมื่อเปลี่ยนหน้า
    watch(() => route.path, async (newPath) => {
        if (newPath === '/product' || newPath === '/') {
            await refreshCart()
        }
    })
    
    // Listen to cart-deleted event
    const handleCartDeleted = async () => {
        console.log('Cart deleted event received, refreshing cart...')
        await refreshCart()
    }
    
    // Listen to cart-item-deleted event (เมื่อลบรายการสินค้าแต่ละรายการ)
    const handleCartItemDeleted = async () => {
        console.log('Cart item deleted event received, refreshing cart...')
        await refreshCart()
    }
    
    // เมื่อมีสร้าง component (Refresh Browser) แล้วให้ตรวจสอบใหม่
    onMounted(async ()=>{
        await refreshCart()
        
        // Listen to cart-deleted event (เมื่อลบตะกร้าทั้งหมด)
        window.addEventListener('cart-deleted', handleCartDeleted)
        // Listen to cart-item-deleted event (เมื่อลบรายการสินค้าแต่ละรายการ)
        window.addEventListener('cart-item-deleted', handleCartItemDeleted)
    })
    
    onUnmounted(() => {
        // Clean up event listeners
        window.removeEventListener('cart-deleted', handleCartDeleted)
        window.removeEventListener('cart-item-deleted', handleCartItemDeleted)
    })
    // ตรวจสอบตะกร้า
    const chkCart=async ()=>{
        console.log('chkCart')
        let members={ mem_email:mem_email.value }
        console.log(members)
        try { // Request POST Method
                const response = await axios.post(`http://localhost:3000/carts/chkcart`,members)
                console.log('chkCart response:', response.data)
                
                // ตรวจสอบว่ามีตะกร้าหรือไม่
                if (response.data.cartExists && response.data.cartId) {
                    cartId.value = response.data.cartId
                } else {
                    // ถ้าไม่มีตะกร้า ให้ reset ค่า
                    cartId.value = null
                    money.value = 0
                    cartStore.setDisplayQty(0)
                }
        }
        catch(err){
            console.log('chkCart error:', err)
            // ถ้าเกิด error ให้ reset ค่า
            cartId.value = null
            money.value = 0
            cartStore.setDisplayQty(0)
        }                
    }
    // ตรวจสอบ Member
    const getMember=async ()=>{
        await axios.get(`http://localhost:3000/members/detail`)
            .then((res)=>{
                mem_email.value=res.data.mem_email
            })
            .catch(err=>console.log(err.message))
    }
    // method เพื่อเรียกการคำนวนค่า มีการส่ง parameter cid คือ รหัสตะกร้าที่ส่งมา
    const sumCart=async(cid)=>{
        console.log(`sumCart: ${cid}`)
        await axios.get(`http://localhost:3000/carts/sumcart/${cid}`)
        .then(res => {
            console.log("SumCart: " + res.data.id)
            cartId .value = res.data.id
            const sumQty = Number(res.data.qty) || 0
            money.value = res.data.money
            cartStore.setDisplayQty(sumQty)
        })
        
        .catch(err => { console.error(err);});
        
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

