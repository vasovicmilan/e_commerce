import * as categoryService from "./category.service.js";
import * as tagService from "./tag.service.js";
import * as itemService from "./item.service.js";
import * as postService from "./post.service.js";
import * as customerService from "./customer.service.js";
import * as userService from "./user.service.js";
import * as couponService from "./coupon.service.js";
import * as orderService from "./order.service.js";
import * as contactService from "./contact.service.js";
import * as newsletterService from "./newsletter.service.js";
import * as temporaryOrderService from "./temporary.order.service.js";

export async function getDashboardStats() {
  const [
    categories,
    tags,
    items,
    posts,
    customers,
    users,
    coupons,
    orderStats,
    contacts,
    newsletters,
    tempOrdersCount,
  ] = await Promise.all([
    categoryService.getCategoryStats(),
    tagService.getTagStats(),
    itemService.getItemStats(),
    postService.getPostStats(),
    customerService.getCustomerStats(),
    userService.getUserStats(),
    couponService.getCouponStats(),
    orderService.getOrderDashboardStats(),
    contactService.getContactStats(),
    newsletterService.getNewsletterStats(),
    temporaryOrderService.countTemporaryOrders(),
  ]);

  return {
    categories,
    tags,
    items,
    posts,
    customers,
    users,
    coupons,
    orders: orderStats,
    contacts,
    newsletters,
    temporaryOrders: tempOrdersCount,
  };
}

export default {
  getDashboardStats,
};