<template>
  <div class="main-wrapper">
    <t-card :bordered="false" class="detail-card">
      <div class="detail-header">
        <t-avatar :image="headPictureUrl" size="100px" />
        <div class="detail-title">
          <div class="name">{{ account.nickname || '-' }}</div>
        </div>
        <t-button theme="primary" @click="isEdit ? handleSave() : (isEdit = true)" style="margin-top: 16px">
          {{ isEdit ? '保存' : '编辑' }}
        </t-button>
      </div>
      <div v-if="!isEdit">
        <t-descriptions :column="3" :bordered="false" size="medium">
          <t-descriptions-item label="姓名">{{ account.name || '-' }}</t-descriptions-item>
          <t-descriptions-item label="性别">
            <span v-if="account.gender === 1">男</span>
            <span v-else-if="account.gender === 2">女</span>
            <span v-else>-</span>
          </t-descriptions-item>
          <t-descriptions-item label="生日">{{ account.birthday || '-' }}</t-descriptions-item>
          <t-descriptions-item label="国家">{{ account.country || '-' }}</t-descriptions-item>
          <t-descriptions-item label="城市">{{ account.city || '-' }}</t-descriptions-item>
          <t-descriptions-item label="详细地址">{{ account.address || '-' }}</t-descriptions-item>
          <t-descriptions-item label="状态">
            <t-tag v-if="account.status === 1" theme="success" variant="light">启用</t-tag>
            <t-tag v-else theme="danger" variant="light">禁用</t-tag>
          </t-descriptions-item>
          <t-descriptions-item label="排序">{{ account.sort ?? '-' }}</t-descriptions-item>
          <t-descriptions-item label="默认密码">{{ account.password || '-' }}</t-descriptions-item>
          <t-descriptions-item label="特点">{{ account.characters || '-' }}</t-descriptions-item>
          <t-descriptions-item label="备注" :span="3">{{ account.notes || '-' }}</t-descriptions-item>
          <t-descriptions-item label="个人简介" :span="3">
            {{ account.biography || '-' }}
          </t-descriptions-item>
        </t-descriptions>
      </div>
      <div v-else>
        <t-form :data="form" ref="formRef" label-width="80px" :colon="true" style="margin-top: 24px">
          <t-form-item label="姓名" name="name">
            <t-input v-model="form.name" />
          </t-form-item>
          <t-form-item label="性别" name="gender">
            <t-radio-group v-model="form.gender">
              <t-radio :value="1">男</t-radio>
              <t-radio :value="2">女</t-radio>
            </t-radio-group>
          </t-form-item>
          <t-form-item label="生日" name="birthday">
            <t-date-picker v-model="form.birthday" />
          </t-form-item>
          <t-form-item label="国家" name="country">
            <t-input v-model="form.country" />
          </t-form-item>
          <t-form-item label="城市" name="city">
            <t-input v-model="form.city" />
          </t-form-item>
          <t-form-item label="详细地址" name="address">
            <t-input v-model="form.address" />
          </t-form-item>
          <t-form-item label="状态" name="status">
            <t-switch v-model="form.status" :custom-value="[1, 0]" />
          </t-form-item>
          <t-form-item label="排序" name="sort">
            <t-input-number v-model="form.sort" />
          </t-form-item>
          <t-form-item label="默认密码" name="password">
            <t-input v-model="form.password" />
          </t-form-item>
          <t-form-item label="特点" name="characters">
            <t-input v-model="form.characters" />
          </t-form-item>
          <t-form-item label="备注" name="notes">
            <t-textarea v-model="form.notes" />
          </t-form-item>
          <t-form-item label="个人简介" name="biography">
            <t-textarea v-model="form.biography" />
          </t-form-item>
        </t-form>
      </div>
    </t-card>
  </div>
</template>

<script setup>
import { ref, onMounted, reactive } from 'vue';
import { MessagePlugin } from 'tdesign-vue-next';

const account = ref({});
const form = reactive({});
const isEdit = ref(false);
const headPictureUrl = ref('');
const formRef = ref();

const fetchDetail = async () => {
  // 模拟数据
  account.value = {
    nickname: '张三',
    name: '张三',
    gender: 1,
    birthday: '2000-01-01',
    country: '中国',
    city: '福州',
    address: 'xxx路',
    status: 1,
    sort: 1,
    password: '123456',
    characters: '细心',
    notes: '无',
    biography: '学生',
    headPicture: '3a68a2baaa8b4f94bc5ff7041c662cf6',
  };
  Object.assign(form, account.value);
  // 后端文件模块已裁剪，头像地址由后续业务接口直接返回时再赋值。
};

const handleSave = async () => {
  // const res = await update(form); // 调用后端接口
  // if (res && res.code === 0) {
  Object.assign(account.value, form);
  isEdit.value = false;
  MessagePlugin.success('保存成功');
  // } else {
  //   MessagePlugin.error('保存失败');
  // }
};

onMounted(() => {
  fetchDetail();
});
</script>

<style scoped>
.detail-card {
  margin: 0 auto;
  max-width: 900px;
  padding: 32px;
}
.detail-header {
  display: flex;
  flex-direction: column;
  align-items: center;
  margin-bottom: 20px;
}
.detail-title {
  margin: 0;
}
.name {
  font-size: 26px;
  font-weight: 500;
  margin-top: 18px;
  margin-bottom: 8px;
  letter-spacing: 8px;
}
</style>
