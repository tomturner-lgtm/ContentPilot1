'use client'

import { TEMPLATES, TemplateType } from '@/lib/templates'

interface TemplateSelectorProps {
  selectedTemplate: TemplateType
  onSelectTemplate: (template: TemplateType) => void
}

export default function TemplateSelector({
  selectedTemplate,
  onSelectTemplate,
}: TemplateSelectorProps) {
  const templates = Object.values(TEMPLATES)

  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-3">
        Template d'article
      </label>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {templates.map((template) => (
          <button
            key={template.id}
            type="button"
            onClick={() => onSelectTemplate(template.id)}
            className={`group relative rounded-lg border-2 p-4 text-left transition-all hover:shadow-md ${
              selectedTemplate === template.id
                ? 'border-primary-500 bg-primary-50'
                : 'border-gray-200 bg-white hover:border-primary-300'
            }`}
          >
            <div className="flex items-start gap-3">
              <span className="text-3xl flex-shrink-0">{template.icon}</span>
              <div className="flex-1 min-w-0">
                <h3
                  className={`font-semibold mb-1 ${
                    selectedTemplate === template.id
                      ? 'text-primary-900'
                      : 'text-gray-900'
                  }`}
                >
                  {template.name}
                </h3>
                <p className="text-xs text-gray-600 mb-2 line-clamp-2">
                  {template.description}
                </p>
                <div className="flex items-center gap-2 text-xs text-gray-500">
                  <span>{template.recommendedLength} mots</span>
                  <span>•</span>
                  <span className="truncate">{template.structure}</span>
                </div>
              </div>
              {selectedTemplate === template.id && (
                <div className="flex-shrink-0">
                  <svg
                    className="h-5 w-5 text-primary-600"
                    fill="none"
                    viewBox="0 0 24 24"
                    strokeWidth="2"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                </div>
              )}
            </div>
            {/* Tooltip au survol */}
            <div className="absolute left-0 top-full mt-2 hidden group-hover:block z-10 w-full">
              <div className="rounded-lg bg-gray-900 text-white p-3 text-xs shadow-lg">
                <div className="font-semibold mb-1">Structure :</div>
                <div className="text-gray-300 mb-2">{template.structure}</div>
                <div className="font-semibold mb-1">Ton :</div>
                <div className="text-gray-300">{template.tone}</div>
              </div>
            </div>
          </button>
        ))}
      </div>
      {selectedTemplate && (
        <div className="mt-3 rounded-lg bg-blue-50 border border-blue-200 p-3">
          <div className="flex items-start gap-2">
            <svg
              className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth="1.5"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M11.25 11.25l.041-.02a.75.75 0 011.063.852l-.708 2.836a.75.75 0 001.063.853l.041-.021M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9-3.75h.008v.008H12V8.25z"
              />
            </svg>
            <div className="text-sm text-blue-800">
              <div className="font-semibold mb-1">
                Template sélectionné : {TEMPLATES[selectedTemplate].name}
              </div>
              <div className="text-blue-700">
                Longueur recommandée : {TEMPLATES[selectedTemplate].recommendedLength} mots
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}