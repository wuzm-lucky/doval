import enabledModules from 'virtual:enabled-modules';

/**
 * 校验构建期生成的模块清单。模块目录名即模块名称。
 *
 * @author wuzm
 */
function validateModules(modules) {
  return modules.map((moduleDefinition) => {
    if (!moduleDefinition?.name) throw new Error('module directory name is required');
    if (!Array.isArray(moduleDefinition.routeModules))
      throw new Error(`module ${moduleDefinition.name} routeModules must be an array`);
    if (moduleDefinition.install && typeof moduleDefinition.install !== 'function')
      throw new Error(`module ${moduleDefinition.name} install must be a function`);
    return moduleDefinition;
  });
}

export const modules = validateModules(enabledModules);

/**
 * 合并当前启用模块目录中路由文件的默认导出。
 *
 * @author wuzm
 */
export function getModuleRoutes() {
  return modules.flatMap((moduleDefinition) =>
    moduleDefinition.routeModules.flatMap((routeModule) => {
      const routes = routeModule.default;
      return Array.isArray(routes) ? routes : routes ? [routes] : [];
    }),
  );
}

/**
 * 将模块语言包写入唯一的 i18n 实例。
 *
 * @author wuzm
 */
export function registerModuleMessages(i18n) {
  modules.forEach((moduleDefinition) => {
    Object.entries(moduleDefinition.messages || {}).forEach(([locale, messages]) =>
      i18n.global.mergeLocaleMessage(locale, messages),
    );
  });
}

/**
 * 在框架实例创建完成后，按命令行模块参数顺序执行可选初始化。
 *
 * @author wuzm
 */
export function installModules(app, context) {
  const registeredComponentNames = new Set();
  modules.forEach((moduleDefinition) => {
    const registerGlobalComponent = (name, component) => {
      if (!name.startsWith(`${moduleDefinition.name}-`))
        throw new Error(`global component ${name} must use ${moduleDefinition.name}- prefix`);
      if (registeredComponentNames.has(name) || app.component(name))
        throw new Error(`global component ${name} already registered`);
      registeredComponentNames.add(name);
      app.component(name, component);
    };
    moduleDefinition.install?.(app, { ...context, registerGlobalComponent });
  });
}
