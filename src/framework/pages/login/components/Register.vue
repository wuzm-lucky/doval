<template>
  <captcha-verify
    v-if="captchaEnabled"
    ref="captchaVerify"
    @success="handleCaptchaSuccess"
    @cancel="clearCaptchaAction"
  />
  <t-form
    ref="form"
    class="item-container"
    :class="[`register-${type}`]"
    :data="formData"
    :rules="FORM_RULES"
    label-width="0"
    @submit="onSubmit"
  >
    <template v-if="type === 'phone'">
      <t-form-item name="phone">
        <t-input
          v-model="formData.phone"
          :maxlength="11"
          size="large"
          :placeholder="t('pages.login.register.phonePlaceholder')"
        >
          <template #prefix-icon>
            <t-icon name="user" />
          </template>
        </t-input>
      </t-form-item>
    </template>

    <template v-if="type === 'email'">
      <t-form-item name="email">
        <t-input
          v-model="formData.email"
          type="text"
          size="large"
          :placeholder="t('pages.login.register.emailPlaceholder')"
        >
          <template #prefix-icon>
            <t-icon name="mail" />
          </template>
        </t-input>
      </t-form-item>
    </template>

    <t-form-item name="password">
      <t-input
        v-model="formData.password"
        size="large"
        :type="showPsw ? 'text' : 'password'"
        clearable
        :placeholder="t('pages.login.register.passwordPlaceholder')"
      >
        <template #prefix-icon>
          <t-icon name="lock-on" />
        </template>
        <template #suffix-icon>
          <t-icon :name="showPsw ? 'browse' : 'browse-off'" @click="showPsw = !showPsw" />
        </template>
      </t-input>
    </t-form-item>

    <template v-if="type === 'phone'">
      <t-form-item class="verification-code" name="verifyCode">
        <t-input
          v-model="formData.verifyCode"
          size="large"
          :placeholder="t('pages.login.register.verifyCodePlaceholder')"
        />
        <t-button variant="outline" :disabled="countDown > 0" @click="sendCode">
          {{
            countDown === 0
              ? t('pages.login.register.sendVerifyCode')
              : t('pages.login.register.resendCountdown', { count: countDown })
          }}
        </t-button>
      </t-form-item>
    </template>

    <t-form-item class="check-container" name="checked">
      <t-checkbox v-model="formData.checked">{{ t('pages.login.register.agreeTerms') }} </t-checkbox>
      <span>{{ t('pages.login.register.serviceTerms') }}</span>
      {{ t('common.conjunction') }}
      <span>{{ t('pages.login.register.privacyStatement') }}</span>
    </t-form-item>

    <t-form-item>
      <t-button block size="large" type="submit"> {{ t('pages.login.register.registerBtn') }} </t-button>
    </t-form-item>

    <div class="switch-container">
      <span class="tip" @click="switchType(type === 'phone' ? 'email' : 'phone')">
        {{ type === 'phone' ? t('pages.login.register.useEmailRegister') : t('pages.login.register.usePhoneRegister') }}
      </span>
    </div>
  </t-form>
</template>
<script setup>
import { MessagePlugin } from 'tdesign-vue-next';
import { computed, ref } from 'vue';

import { useCounter } from '@framework/hooks';
import { t } from '@framework/locales';
import { registerByAuth, sendMessageVerificationCode } from '@framework/api/auth';
import CaptchaVerify from '@framework/components/CaptchaVerify.vue';

const emit = defineEmits(['register-success']);

const INITIAL_DATA = {
  phone: '',
  email: '',
  password: '',
  verifyCode: '',
  checked: false,
};

const FORM_RULES = computed(() => ({
  phone: [{ required: true, message: t('pages.login.register.validation.phone'), type: 'error' }],
  email: [
    { required: true, message: t('pages.login.register.validation.email'), type: 'error' },
    { email: true, message: t('pages.login.register.validation.emailFormat'), type: 'warning' },
  ],
  password: [{ required: true, message: t('pages.login.register.validation.password'), type: 'error' }],
  verifyCode: [{ required: true, message: t('pages.login.register.validation.verifyCode'), type: 'error' }],
}));

const type = ref('phone');

const form = ref();
const formData = ref({ ...INITIAL_DATA });
const captchaVerify = ref();
const captchaEnabled = import.meta.env.VITE_CAPTCHA_ENABLE === 'true';
const captchaAction = ref();

const showPsw = ref(false);

const [countDown, handleCounter] = useCounter();

/** 打开验证码前保存待执行动作，验证成功后由组件事件继续当前业务流程。 */
const openCaptcha = (action) => {
  if (!captchaEnabled) return action();
  captchaAction.value = action;
  captchaVerify.value.open();
};

/** 验证成功后执行待处理业务动作。 */
const handleCaptchaSuccess = (captchaVerification) => {
  const action = captchaAction.value;
  captchaAction.value = undefined;
  action?.(captchaVerification);
};

/** 用户取消验证时丢弃待处理动作，不展示额外提示。 */
const clearCaptchaAction = () => {
  captchaAction.value = undefined;
};

/** 发送注册短信前先完成行为验证，避免短信接口被自动化滥用。 */
const sendCode = async () => {
  const valid = await form.value?.validate({ fields: ['phone'] });
  if (valid !== true) return;
  const requestCode = async (captchaVerification) => {
    try {
      await sendMessageVerificationCode({
        authType: 'PHONE',
        identifier: formData.value.phone,
        scene: 'regiser',
        captchaVerification,
      });
      handleCounter();
      MessagePlugin.success('验证码已发送');
    } catch (error) {
      MessagePlugin.error(error instanceof Error ? error.message : String(error));
    }
  };
  await openCaptcha(requestCode);
};

/** 手机号注册消费短信验证码；邮箱注册仍需完成行为验证码。 */
const onSubmit = async (ctx) => {
  if (ctx.validateResult !== true) return;
  if (!formData.value.checked) {
    MessagePlugin.error(t('pages.login.register.validation.agreeTerms'));
    return;
  }
  const register = async (captchaVerification) => {
    try {
      const identifier = type.value === 'phone' ? formData.value.phone : formData.value.email;
      await registerByAuth({
        authType: type.value === 'phone' ? 'PHONE' : 'EMAIL',
        identifier,
        password: formData.value.password,
        agreementAccepted: true,
        verifyCode: type.value === 'phone' ? formData.value.verifyCode : undefined,
        // 手机号已在发送短信时完成图形验证码，避免注册提交时重复弹出验证码。
        captchaVerification,
      });
      MessagePlugin.success(t('pages.login.register.messages.registerSuccess'));
      emit('register-success');
    } catch (error) {
      MessagePlugin.error(error instanceof Error ? error.message : String(error));
    }
  };
  if (type.value === 'email') {
    await openCaptcha(register);
  } else {
    await register();
  }
};

const switchType = (val) => {
  form.value.reset();
  type.value = val;
};
</script>
<style lang="less" scoped>
@import '../index.less';
</style>
