// src/context/FormContext.jsx
import React, { createContext, useContext, useState, useEffect, useRef } from 'react'

const FormContext = createContext()

export function FormProvider({ children }) {
  const [forms, setForms] = useState(() => {
    try {
      const saved = sessionStorage.getItem('all_forms')
      return saved ? JSON.parse(saved) : {}
    } catch {
      return {}
    }
  })

  const saveTimeout = useRef(null)

  // ✅ Debounced save to sessionStorage (avoids jank on every keystroke)
  useEffect(() => {
    if (saveTimeout.current) clearTimeout(saveTimeout.current)
    saveTimeout.current = setTimeout(() => {
      try {
        sessionStorage.setItem('all_forms', JSON.stringify(forms))
      } catch {
        // ignore
      }
    }, 500) // Save after 500ms of inactivity
  }, [forms])

  const setFormData = (storageKey, data) => {
    setForms(prev => ({
      ...prev,
      [storageKey]: data
    }))
  }

  const getFormData = (storageKey) => {
    return forms[storageKey] || null
  }

  const clearForm = (storageKey) => {
    setForms(prev => {
      const newForms = { ...prev }
      delete newForms[storageKey]
      return newForms
    })
  }

  return (
    <FormContext.Provider value={{ forms, setFormData, getFormData, clearForm }}>
      {children}
    </FormContext.Provider>
  )
}

export function useForm() {
  const context = useContext(FormContext)
  if (!context) {
    throw new Error('useForm must be used within a FormProvider')
  }
  return context
}