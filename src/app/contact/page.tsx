'use client'

import { useState, useEffect } from 'react'

// Force dynamic rendering - prevent prerendering
export const dynamic = 'force-static'
import Link from 'next/link'

interface Contact {
  id: string
  displayName: string
  phoneNumbers?: string[]
  emails?: string[]
  organizationName?: string
}

export default function ContactPage() {
  const [contacts, setContacts] = useState<Contact[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedContact, setSelectedContact] = useState<Contact | null>(null)

  const loadContacts = async () => {
    try {
      setLoading(true)
      setError(null)

      // Check if Web Contacts API is supported
      if (!('contacts' in navigator)) {
        setError('Your browser doesn\'t support the Contacts API. Try using a modern browser like Chrome, Safari, or Edge.')
        return
      }

      // Check if we already have permission
      if ('permissions' in navigator) {
        const permission = await navigator.permissions.query({ name: 'contacts' as PermissionName })
        if (permission.state === 'denied') {
          setError('Contacts permission denied. Please allow access to contacts in your browser settings and try again.')
          return
        }
      }

      try {
        // Request contacts using Web Contacts API
        const contacts = await (navigator as any).contacts.select(['name', 'tel', 'email'], { multiple: true })

        const contactList: Contact[] = contacts.map((contact: any, index: number) => ({
          id: `contact_${index}_${Date.now()}`,
          displayName: contact.name?.[0] || 'Unknown',
          phoneNumbers: contact.tel || [],
          emails: contact.email || [],
          organizationName: undefined // Web Contacts API doesn't provide organization info
        }))

        setContacts(contactList)
      } catch (permissionError) {
        // User cancelled or denied permission
        setError('Contacts access was cancelled or denied. Please try again and allow access when prompted.')
      }
    } catch (err) {
      console.error('Load contacts error:', err)
      setError('Failed to load contacts. Please check your browser permissions and try again.')
    } finally {
      setLoading(false)
    }
  }

  const filteredContacts = contacts.filter(contact =>
    contact.displayName.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const callContact = (phoneNumber: string) => {
    window.location.href = `tel:${phoneNumber}`
  }

  const emailContact = (email: string) => {
    window.location.href = `mailto:${email}`
  }

  useEffect(() => {
    loadContacts()
  }, [])

  return (
    <div className="min-h-screen mobile-gradient-bg">
      {/* Enhanced Header */}
      <header className="page-header">
        <div className="flex items-center justify-between">
          <Link href="/" className="btn-ghost text-blue-600 hover:text-blue-700 p-2">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            <span className="ml-2 font-medium">Back</span>
          </Link>
          <div className="text-center">
            <h1 className="page-title">👥 Contacts</h1>
            <p className="page-subtitle">Device contact access</p>
          </div>
          <div className="w-16"></div> {/* Spacer for centering */}
        </div>
      </header>

      {/* Main Content */}
      <main className="px-4 py-4 pb-6 max-w-full overflow-y-auto h-[calc(100vh-76px)]">
        {/* Enhanced Search Bar */}
        {contacts.length > 0 && (
          <div className="feature-card mb-5">
            <div className="card-body px-5 py-4">
              <div className="relative">
                <input
                  type="text"
                  placeholder="Search contacts..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="input-primary pl-12"
                />
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </div>
                {searchTerm && (
                  <button
                    onClick={() => setSearchTerm('')}
                    className="absolute inset-y-0 right-0 pr-4 flex items-center text-gray-400 hover:text-gray-600"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Load Contacts Button */}
        {contacts.length === 0 && !loading && (
          <div className="feature-card mb-5">
            <div className="card-body px-5 py-6 text-center">
              <div className="w-20 h-20 bg-gradient-to-r from-teal-100 to-cyan-100 rounded-3xl flex items-center justify-center mx-auto mb-4">
                <span className="text-4xl">👥</span>
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-3">Access Your Contacts</h3>
              <p className="text-gray-600 mb-6 leading-relaxed">
                Access and manage your device contacts directly from your browser
              </p>

              <div className="space-y-4">
                <button
                  onClick={loadContacts}
                  className="btn-primary w-full"
                >
                  <span className="text-xl mr-2">📱</span>
                  <span>Load Contacts</span>
                </button>
                <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
                  <p className="text-blue-800 text-sm">
                    🔒 This will request permission to access your device contacts securely
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Enhanced Loading State */}
        {loading && (
          <div className="feature-card mb-5">
            <div className="card-body px-5 py-6">
              <div className="flex items-center justify-center py-8">
                <div className="loading-spinner mr-3"></div>
                <div>
                  <div className="text-lg font-semibold text-gray-900">Loading contacts...</div>
                  <div className="text-sm text-gray-600">This may take a moment</div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Enhanced Error State */}
        {error && (
          <div className="feature-card mb-5">
            <div className="card-body px-5 py-4">
              <div className="bg-red-50 border border-red-200 rounded-2xl p-4">
                <div className="flex items-center">
                  <span className="text-red-600 mr-3 text-lg">⚠️</span>
                  <p className="text-red-800 text-sm font-medium">{error}</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Enhanced Contact List */}
        {!loading && contacts.length > 0 && (
          <div className="feature-card">
            <div className="card-header px-5 py-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-bold text-gray-900">📋 Contacts</h3>
                <div className="status-badge status-info">
                  <span>{filteredContacts.length} of {contacts.length}</span>
                </div>
              </div>
            </div>

            <div className="card-body px-5 pb-5">
              <div className="space-y-3">
                {filteredContacts.map((contact) => (
                  <div
                    key={contact.id}
                    className="bg-white border border-gray-200 rounded-2xl p-4 hover:bg-gray-50 transition-all duration-200 shadow-sm hover:shadow-md"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center space-x-3 mb-2">
                          <div className="w-10 h-10 bg-gradient-to-r from-teal-400 to-cyan-500 rounded-2xl flex items-center justify-center">
                            <span className="text-white font-bold text-sm">
                              {contact.displayName.charAt(0).toUpperCase()}
                            </span>
                          </div>
                          <div className="flex-1 min-w-0">
                            <h3 className="font-bold text-gray-900 truncate">{contact.displayName}</h3>
                            {contact.organizationName && (
                              <p className="text-sm text-gray-600 truncate">{contact.organizationName}</p>
                            )}
                          </div>
                        </div>

                        {contact.phoneNumbers && contact.phoneNumbers.length > 0 && (
                          <div className="flex items-center space-x-2 mb-2">
                            <div className="w-4 h-4 bg-green-100 rounded-full flex items-center justify-center">
                              <span className="text-green-600 text-xs">📞</span>
                            </div>
                            <p className="text-sm text-gray-700 font-medium">
                              {contact.phoneNumbers[0]}
                            </p>
                          </div>
                        )}

                        {contact.emails && contact.emails.length > 0 && (
                          <div className="flex items-center space-x-2">
                            <div className="w-4 h-4 bg-blue-100 rounded-full flex items-center justify-center">
                              <span className="text-blue-600 text-xs">✉️</span>
                            </div>
                            <p className="text-sm text-gray-700 truncate">
                              {contact.emails[0]}
                            </p>
                          </div>
                        )}
                      </div>

                      <div className="flex space-x-2 ml-3">
                        {contact.phoneNumbers && contact.phoneNumbers.length > 0 && (
                          <button
                            onClick={() => callContact(contact.phoneNumbers[0])}
                            className="btn-success p-3"
                            title="Call"
                          >
                            <span className="text-lg">📞</span>
                          </button>
                        )}
                        {contact.emails && contact.emails.length > 0 && (
                          <button
                            onClick={() => emailContact(contact.emails[0])}
                            className="btn-primary p-3"
                            title="Email"
                          >
                            <span className="text-lg">✉️</span>
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Enhanced Contact Detail Modal */}
        {selectedContact && (
          <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center p-4 z-50 backdrop-blur-sm">
            <div className="bg-white rounded-3xl shadow-2xl max-w-md w-full max-h-[85vh] overflow-hidden">
              <div className="px-6 py-5 border-b border-gray-100">
                <div className="flex justify-between items-center">
                  <h3 className="text-xl font-bold text-gray-900">Contact Details</h3>
                  <button
                    onClick={() => setSelectedContact(null)}
                    className="btn-ghost text-gray-400 hover:text-gray-600 p-2"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              </div>

              <div className="px-6 pb-6 max-h-96 overflow-y-auto">
                <div className="space-y-6">
                  {/* Contact Avatar and Name */}
                  <div className="text-center">
                    <div className="w-20 h-20 bg-gradient-to-r from-teal-400 to-cyan-500 rounded-3xl flex items-center justify-center mx-auto mb-4">
                      <span className="text-white font-bold text-2xl">
                        {selectedContact.displayName.charAt(0).toUpperCase()}
                      </span>
                    </div>
                    <h4 className="text-xl font-bold text-gray-900">{selectedContact.displayName}</h4>
                    {selectedContact.organizationName && (
                      <p className="text-gray-600 mt-1">{selectedContact.organizationName}</p>
                    )}
                  </div>

                  {/* Phone Numbers */}
                  {selectedContact.phoneNumbers && selectedContact.phoneNumbers.length > 0 && (
                    <div>
                      <label className="text-sm font-bold text-gray-700 mb-3 block">📞 Phone Numbers</label>
                      <div className="space-y-3">
                        {selectedContact.phoneNumbers.map((phone, index) => (
                          <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-xl">
                            <div>
                              <span className="text-gray-900 font-medium">{phone}</span>
                            </div>
                            <button
                              onClick={() => callContact(phone)}
                              className="btn-success px-4 py-2 text-sm"
                            >
                              Call
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Email Addresses */}
                  {selectedContact.emails && selectedContact.emails.length > 0 && (
                    <div>
                      <label className="text-sm font-bold text-gray-700 mb-3 block">✉️ Email Addresses</label>
                      <div className="space-y-3">
                        {selectedContact.emails.map((email, index) => (
                          <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-xl">
                            <div>
                              <span className="text-gray-900 font-medium truncate block">{email}</span>
                            </div>
                            <button
                              onClick={() => emailContact(email)}
                              className="btn-primary px-4 py-2 text-sm"
                            >
                              Email
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  )
}
