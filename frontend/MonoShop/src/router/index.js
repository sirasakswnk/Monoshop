import { createRouter,createMemoryHistory } from "vue-router";
import TheProduct from "@/components/TheProduct.vue";
import TheLogin from "@/components/TheLogin.vue";
import TheHome from "@/components/TheHome.vue";
import TheRegister from "@/components/TheRegister.vue";
import PageMember from "@/components/PageMember.vue";
import ProductShow from "@/components/ProductShow.vue";
import CartShow from "../components/CartShow.vue"
import CartList from "@/components/CartList.vue";
import OrderList from "@/components/OrderList.vue";
import AdminOrders from "@/components/AdminOrders.vue";

const routes = [
    {
        path: '/',
        name: 'home',
        component:TheHome
    },
    {
        path: '/product',
        name: 'product',
        component:TheProduct
    },
    {
        path: '/login',
        name: 'Login',
        component:TheLogin
    },
    {
        path: '/register',
        name: 'Register',
        component:TheRegister
    },
    {
        path: '/pagemember',
        name: 'PageMember',
        component:PageMember
    },
    {
        path: '/ProductShow/:pdId',
        name: 'ProductShow',
        component:ProductShow
    },
    {
        path:'/cartShow/:cart_id',
        name:'CartShow',
        component:CartShow
    },
    {
        path:'/cartList',
        name:'CartList',
        component:CartList
    },
    {
        path: "/orders",
        name: "Orders",
        component: OrderList,
    },
    {
        path: "/admin/orders",
        name: "AdminOrders",
        component: AdminOrders,
    },

]

const router = createRouter({
    history:createMemoryHistory(import.meta.env.BASE_URL),routes
})

export default router