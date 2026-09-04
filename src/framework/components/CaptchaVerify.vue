<template>
  <t-dialog
    v-model:visible="visible"
    class="captcha-dialog"
    header="请完成安全验证"
    width="480px"
    :footer="false"
    :close-on-overlay-click="false"
    @close="cancel"
  >
    <div class="captcha">
      <div v-if="loading" class="captcha-loading">正在加载验证码...</div>
      <template v-else-if="captcha">
        <div class="captcha-image">
          <img :src="imageSource" alt="验证码背景" draggable="false" />
          <div class="captcha-piece" :style="pieceStyle">
            <img :src="pieceSource" alt="可拖动拼图块" draggable="false" />
          </div>
          <button class="captcha-refresh" type="button" title="刷新验证码" :disabled="checking" @click="loadCaptcha">
            <t-icon name="refresh" />
          </button>
          <div v-if="feedback" class="captcha-feedback" :class="`captcha-feedback--${feedback.type}`">
            {{ feedback.message }}
          </div>
        </div>
        <div ref="sliderTrack" class="captcha-slider" :class="`captcha-slider--${sliderState}`">
          <div class="captcha-slider__progress" :style="sliderProgressStyle" />
          <span class="captcha-slider__hint">{{ sliderHint }}</span>
          <button
            class="captcha-slider__handle"
            type="button"
            :style="sliderHandleStyle"
            :disabled="checking"
            aria-label="拖动滑块完成验证"
            @pointerdown.prevent="startDrag"
          >
            <t-icon :name="sliderState === 'success' ? 'check' : 'chevron-right'" />
          </button>
        </div>
      </template>
      <div v-else class="captcha-loading">{{ loadError || '验证码加载失败，请刷新后重试' }}</div>
    </div>
  </t-dialog>
</template>

<script setup>
import CryptoJS from 'crypto-js';
import { computed, onBeforeUnmount, ref } from 'vue';

// 统一封装 AJ-Captcha 拼图验证，供登录、注册及后续敏感操作复用。
import { checkCaptcha as checkCaptchaRequest, getCaptcha } from '@framework/api/auth';

const MAX_SLIDER_VALUE = 263;
const CAPTCHA_IMAGE_SCALE = 380 / 310;
const SLIDER_HANDLE_SIZE = 38;
const captcha = ref();
const checking = ref(false);
const feedback = ref();
const loadError = ref('');
const loading = ref(false);
const sliderState = ref('idle');
const sliderTrack = ref();
const sliderValue = ref(0);
const visible = ref(false);
const emit = defineEmits(['success', 'cancel']);
let activePointerId;
let closeReason;

const imageSource = computed(() => `data:image/png;base64,${captcha.value.originalImageBase64}`);
const pieceSource = computed(() => `data:image/png;base64,${captcha.value.jigsawImageBase64}`);
const pieceStyle = computed(() => ({ left: `${sliderValue.value * CAPTCHA_IMAGE_SCALE}px` }));
const sliderProgress = computed(() => (sliderValue.value / MAX_SLIDER_VALUE) * 100);
const sliderProgressStyle = computed(() => ({ width: `calc(${sliderProgress.value}% + ${SLIDER_HANDLE_SIZE / 2}px)` }));
/** 滑块从轨道起点完整显示，到终点时刚好贴合右边界。 */
const sliderHandleStyle = computed(() => ({
  left: `calc(${sliderProgress.value}% - ${(sliderProgress.value * SLIDER_HANDLE_SIZE) / 100}px)`,
}));
const sliderHint = computed(() => {
  if (checking.value) return '正在验证...';
  if (sliderState.value === 'success') return '验证成功';
  if (sliderState.value === 'error') return '验证失败，请重试';
  return '向右滑动完成验证';
});

/** 将验证码坐标按 AJ-Captcha 约定使用服务端下发密钥加密。 */
function aesEncrypt(value, secretKey) {
  if (!secretKey) return value;
  return CryptoJS.AES.encrypt(CryptoJS.enc.Utf8.parse(value), CryptoJS.enc.Utf8.parse(secretKey), {
    mode: CryptoJS.mode.ECB,
    padding: CryptoJS.pad.Pkcs7,
  }).toString();
}

/** 获取后端生成的拼图挑战，并复位滑块、提示和反馈状态。 */
async function loadCaptcha() {
  loading.value = true;
  loadError.value = '';
  feedback.value = undefined;
  sliderState.value = 'idle';
  sliderValue.value = 0;
  try {
    const response = await getCaptcha({ captchaType: 'blockPuzzle', clientUid: getClientUid(), ts: Date.now() });
    if (response?.repCode !== '0000' || !response.repData) throw new Error(response?.repMsg || '验证码加载失败');
    captcha.value = response.repData;
  } catch (error) {
    captcha.value = undefined;
    loadError.value = error instanceof Error ? error.message : String(error);
  } finally {
    loading.value = false;
  }
}

/** 以稳定的浏览器标识配合 AJ-Captcha 的频率控制。 */
function getClientUid() {
  const storageKey = 'aj-captcha-client-uid';
  let clientUid = localStorage.getItem(storageKey);
  if (!clientUid) {
    clientUid = crypto.randomUUID();
    localStorage.setItem(storageKey, clientUid);
  }
  return clientUid;
}

/** 按鼠标或触摸位置同步滑块与拼图块的位置。 */
function moveSlider(clientX) {
  const track = sliderTrack.value;
  if (!track) return;
  const bounds = track.getBoundingClientRect();
  const trackTravel = bounds.width - SLIDER_HANDLE_SIZE;
  const offset = Math.min(Math.max(clientX - bounds.left - SLIDER_HANDLE_SIZE / 2, 0), trackTravel);
  sliderValue.value = Math.round((offset / trackTravel) * MAX_SLIDER_VALUE);
}

/** 开始拖动滑块，并在窗口级别监听移动和释放事件。 */
function startDrag(event) {
  if (checking.value) return;
  activePointerId = event.pointerId;
  sliderState.value = 'dragging';
  moveSlider(event.clientX);
  window.addEventListener('pointermove', dragSlider);
  window.addEventListener('pointerup', finishDrag, { once: true });
}

/** 拖动过程中仅更新视觉位置，不提前发起校验请求。 */
function dragSlider(event) {
  if (event.pointerId === activePointerId) moveSlider(event.clientX);
}

/** 释放滑块后提交一次拼图坐标校验。 */
async function finishDrag(event) {
  window.removeEventListener('pointermove', dragSlider);
  if (event.pointerId !== activePointerId) return;
  activePointerId = undefined;
  await checkCaptcha();
}

/** 提交滑块位置，成功后向调用方返回业务接口所需的 captchaVerification。 */
async function checkCaptcha() {
  if (!captcha.value || checking.value) return;
  checking.value = true;
  const point = JSON.stringify({ x: sliderValue.value, y: 5.0 });
  try {
    const response = await checkCaptchaRequest({
      captchaType: 'blockPuzzle',
      pointJson: aesEncrypt(point, captcha.value.secretKey),
      token: captcha.value.token,
    });
    if (response?.repCode !== '0000') throw new Error(response?.repMsg || '验证失败，请重试');
    sliderState.value = 'success';
    feedback.value = { type: 'success', message: '验证成功' };
    const captchaVerification = aesEncrypt(`${captcha.value.token}---${point}`, captcha.value.secretKey);
    window.setTimeout(() => {
      closeReason = 'success';
      visible.value = false;
      emit('success', captchaVerification);
    }, 350);
  } catch (error) {
    sliderState.value = 'error';
    feedback.value = { type: 'error', message: error instanceof Error ? error.message : String(error) };
    window.setTimeout(loadCaptcha, 700);
  } finally {
    checking.value = false;
  }
}

/** 打开验证码弹窗；验证结果通过 success 或 cancel 事件通知调用方。 */
async function open() {
  closeReason = undefined;
  visible.value = true;
  await loadCaptcha();
}

/** 用户主动关闭时通知调用方清理待执行动作，无需构造或传递取消异常。 */
function cancel() {
  window.removeEventListener('pointermove', dragSlider);
  activePointerId = undefined;
  if (closeReason === 'success') {
    closeReason = undefined;
    return;
  }
  emit('cancel');
}

onBeforeUnmount(cancel);
defineExpose({ open });
</script>

<style lang="less" scoped>
.captcha {
  width: 380px;
}
.captcha-loading {
  display: flex;
  min-height: 240px;
  align-items: center;
  justify-content: center;
  color: var(--td-text-color-secondary);
}
.captcha-image {
  position: relative;
  width: 380px;
  height: 190px;
  margin: 0 0 10px;
  overflow: hidden;
  user-select: none;
  border-radius: var(--td-radius-small);
}
.captcha-image > img {
  display: block;
  width: 100%;
  height: 100%;
}
.captcha-piece {
  position: absolute;
  top: 0;
  width: 58px;
  height: 190px;
  overflow: hidden;
  pointer-events: none;
}
.captcha-piece img {
  position: absolute;
  top: 0;
  left: 0;
  width: 58px;
  height: 190px;
}
.captcha-refresh {
  position: absolute;
  top: var(--td-comp-margin-s);
  right: var(--td-comp-margin-s);
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 28px;
  height: 28px;
  padding: 0;
  color: var(--td-text-color-anti);
  cursor: pointer;
  background: rgb(0 0 0 / 36%);
  border: 0;
  border-radius: var(--td-radius-circle);
}
.captcha-refresh:disabled {
  cursor: not-allowed;
}
.captcha-feedback {
  position: absolute;
  right: 0;
  bottom: 0;
  left: 0;
  height: 30px;
  padding: 0 var(--td-comp-paddingLR-m);
  line-height: 30px;
  color: var(--td-text-color-anti);
}
.captcha-feedback--success {
  background: rgb(0 168 112 / 72%);
}
.captcha-feedback--error {
  background: rgb(217 83 79 / 72%);
}
.captcha-slider {
  position: relative;
  width: 380px;
  height: 38px;
  margin: 0 auto;
  overflow: hidden;
  background: var(--td-bg-color-container);
  border: 1px solid var(--td-component-border);
  border-radius: var(--td-radius-small);
  user-select: none;
}
.captcha-slider__progress {
  position: absolute;
  top: 0;
  bottom: 0;
  left: 0;
  background: var(--td-brand-color-light);
  transition: width 0.08s linear;
}
.captcha-slider__hint {
  position: absolute;
  inset: 0;
  z-index: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--td-text-color-secondary);
  pointer-events: none;
}
.captcha-slider__handle {
  position: absolute;
  top: -1px;
  z-index: 2;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 38px;
  height: 38px;
  padding: 0;
  color: var(--td-text-color-primary);
  cursor: grab;
  touch-action: none;
  background: var(--td-bg-color-container);
  border: 1px solid var(--td-component-border);
  border-radius: var(--td-radius-small);
  box-shadow: var(--td-shadow-1);
  transition: left 0.08s linear;
}
.captcha-slider__handle:disabled {
  cursor: wait;
}
.captcha-slider--dragging .captcha-slider__progress {
  background: var(--td-brand-color);
}
.captcha-slider--dragging .captcha-slider__handle {
  color: var(--td-text-color-anti);
  background: var(--td-brand-color);
  border-color: var(--td-brand-color);
}
.captcha-slider--error .captcha-slider__progress,
.captcha-slider--error .captcha-slider__handle {
  color: var(--td-text-color-anti);
  background: var(--td-error-color);
  border-color: var(--td-error-color);
}
.captcha-slider--success .captcha-slider__progress,
.captcha-slider--success .captcha-slider__handle {
  color: var(--td-text-color-anti);
  background: var(--td-success-color);
  border-color: var(--td-success-color);
}
/* 弹窗经 Teleport 挂载到页面根节点，使用全局选择器覆盖其默认滚动容器。 */
:global(.captcha-dialog .t-dialog__body) {
  padding: var(--td-comp-paddingTB-s) var(--td-comp-paddingLR-m) var(--td-comp-paddingTB-m);
  overflow: hidden !important;
}
</style>
