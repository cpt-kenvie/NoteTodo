import { createRouter, createWebHistory } from 'vue-router'
import { isAuthenticated, isAdmin } from '../api/auth'
import { toast } from '../plugins/toast'

// 导入页面组件
import NoteList from '../views/NoteList.vue'
import NoteEdit from '../views/NoteEdit.vue'
import AllList from '../views/AllList.vue'
import CompletedList from '../views/CompletedList.vue'
import Login from '../views/Login.vue'
import Register from '../views/Register.vue'
import AdminUsersNew from '../views/AdminUsersNew.vue'
import AdminDebug from '../views/AdminDebug.vue'
import Profile from '../views/Profile.vue'

const routes = [
  {
    path: '/',
    name: 'Today',
    component: NoteList,
    meta: { requiresAuth: true }
  },
  {
    path: '/edit/:id',
    name: 'Edit',
    component: NoteEdit,
    meta: { requiresAuth: true }
  },
  {
    path: '/create',
    name: 'Create',
    component: NoteEdit,
    meta: { requiresAuth: true }
  },
  {
    path: '/all',
    name: 'All',
    component: AllList,
    meta: { requiresAuth: true }
  },
  {
    path: '/completed',
    name: 'Completed',
    component: CompletedList,
    meta: { requiresAuth: true }
  },
  {
    path: '/login',
    name: 'Login',
    component: Login,
    meta: { guest: true }
  },
  {
    path: '/register',
    name: 'Register',
    component: Register,
    meta: { guest: true }
  },
  {
    path: '/profile',
    name: 'Profile',
    component: Profile,
    meta: { requiresAuth: true }
  },
  {
    path: '/admin/users',
    name: 'AdminUsers',
    component: AdminUsersNew,
    meta: { requiresAuth: true, requiresAdmin: true }
  },
  {
    path: '/debug',
    name: 'AdminDebug',
    component: AdminDebug
  },
  // 直接访问路径（无权限检查，仅用于测试）
  {
    path: '/direct/admin/users',
    name: 'DirectAdminUsers',
    component: AdminUsersNew
  },
  // 重定向任何未匹配的路由到主页
  {
    path: '/:pathMatch(.*)*',
    redirect: '/'
  }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

// 路由守卫
router.beforeEach((to, _from, next) => {
  const authenticated = isAuthenticated()
  const adminUser = isAdmin()

  // 需要管理员权限的页面
  if (to.meta.requiresAdmin && !adminUser) {
    console.error('路由守卫 - 拒绝访问管理员页面，管理员状态:', adminUser)
    toast.error('没有管理员权限')
    next('/')
    return
  }
  
  // 需要认证的页面
  if (to.meta.requiresAuth && !authenticated) {
    next('/login')
    return
  }

  // 游客页面（已登录用户不应访问）
  if (to.meta.guest && authenticated) {
    next('/')
    return
  }
  
  // 其他情况正常导航
  next()
})

export default router 