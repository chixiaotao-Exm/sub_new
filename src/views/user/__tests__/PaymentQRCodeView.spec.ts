import {mount, flushPromises} from '@vue/test-utils'
import {afterEach,beforeEach,describe,expect,it,vi} from 'vitest'
const state=vi.hoisted(()=>({query:{} as Record<string,string>,poll:vi.fn()}))
vi.mock('vue-router',()=>({useRoute:()=>state,useRouter:()=>({push:vi.fn()})}))
vi.mock('vue-i18n',async importOriginal=>({...await importOriginal<typeof import('vue-i18n')>(),useI18n:()=>({t:(key:string)=>key})}))
vi.mock('@/components/layout/AppLayout.vue',()=>({default:{template:'<div><slot/></div>'}}))
vi.mock('@/stores/payment',()=>({usePaymentStore:()=>({pollOrderStatus:state.poll})}))
vi.mock('@/stores',()=>({useAppStore:()=>({showError:vi.fn()})}))
vi.mock('@/api/payment',()=>({paymentAPI:{cancelOrder:vi.fn()}}))
vi.mock('qrcode',()=>({default:{toCanvas:vi.fn()}}))
import View from '../PaymentQRCodeView.vue'
describe('payment QR link validation',()=>{
 beforeEach(()=>{vi.useFakeTimers();state.query={};state.poll.mockReset()})
 afterEach(()=>vi.useRealTimers())
 it.each(['','0','-1','1.5','NaN','Infinity'])('rejects invalid order %s without a misleading countdown',async id=>{
  state.query={order_id:id}
  const wrapper=mount(View,{global:{stubs:{AppLayout:{template:'<div><slot/></div>'}}}})
  await flushPromises()
  expect(wrapper.get('[role=alert]').text()).toBe('payment.errors.NOT_FOUND')
  expect(wrapper.text()).not.toContain('payment.qr.waitingPayment')
  await vi.advanceTimersByTimeAsync(5000)
  expect(state.poll).not.toHaveBeenCalled();wrapper.unmount()
 })
 it('treats malformed expiry as expired without polling',async()=>{
  state.query={order_id:'12',expires_at:'not-a-date'}
  const wrapper=mount(View,{global:{stubs:{AppLayout:{template:'<div><slot/></div>'}}}})
  await flushPromises()
  expect(wrapper.text()).toContain('payment.qr.expired')
  expect(wrapper.text()).not.toContain('NaN')
  await vi.advanceTimersByTimeAsync(5000);expect(state.poll).not.toHaveBeenCalled();wrapper.unmount()
 })
 it('polls a valid order and clears timers on leaving',async()=>{
  state.query={order_id:'12'};state.poll.mockResolvedValue({status:'PENDING'})
  const wrapper=mount(View,{global:{stubs:{AppLayout:{template:'<div><slot/></div>'}}}})
  await vi.advanceTimersByTimeAsync(3000);expect(state.poll).toHaveBeenCalledWith(12)
  wrapper.unmount();state.poll.mockClear();await vi.advanceTimersByTimeAsync(6000);expect(state.poll).not.toHaveBeenCalled()
 })
 it.each(['javascript:alert(1)','data:text/html,unsafe'])('does not expose an executable payment URL %s',async payUrl=>{
  state.query={order_id:'12',pay_url:payUrl}
  const wrapper=mount(View,{global:{stubs:{AppLayout:{template:'<div><slot/></div>'}}}})
  await flushPromises();expect(wrapper.find('a').exists()).toBe(false);wrapper.unmount()
 })
 it.each(['https://pay.example.invalid/order','alipays://platformapi/startapp','weixin://wxpay/bizpayurl'])('preserves supported payment URL %s',async payUrl=>{
  state.query={order_id:'12',pay_url:payUrl}
  const wrapper=mount(View,{global:{stubs:{AppLayout:{template:'<div><slot/></div>'}}}})
  await flushPromises();expect(wrapper.get('a').attributes('href')).toBe(new URL(payUrl).href);wrapper.unmount()
 })
})
