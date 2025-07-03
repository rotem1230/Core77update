export interface Template {
  id: string;
  title: string;
  description: string;
  imageUrl: string;
  githubUrl?: string;
  isOfficial: boolean;
}

export const DEFAULT_TEMPLATE_ID = "";

export const templatesData: Template[] = [];

export function getTemplateOrThrow(templateId: string): Template {
  const template = templatesData.find((template) => template.id === templateId);
  if (!template) {
    throw new Error(`Template ${templateId} not found`);
  }
  return template;
}
