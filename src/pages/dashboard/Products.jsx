// src/pages/dashboard/Products.jsx
import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { Plus, Search, MoreHorizontal, Pencil, Trash2, Loader2, AlertCircle, Package, X, Link, ChevronLeft, ChevronRight } from 'lucide-react'
import EmptyState from '../../components/EmptyState'
import { productAPI } from '../../services/apiClient'
import ServerError from '../../components/ServerError'
import { useAuth } from '../../context/AuthContext'

const PAGE_SIZE = 20

function parseErrorMessage(error) {
  const message = error?.message || '';
  
  if (message.includes('<!DOCTYPE') || message.includes('HTML')) {
    return 'Server error. Please check your connection and try again.';
  }
  if (message.includes('401') || message.includes('Unauthorized')) {
    return 'Your session has expired. Please log in again.';
  }
  if (message.includes('403') || message.includes('Forbidden')) {
    return 'You don\'t have permission to perform this action.';
  }
  if (message.includes('404') || message.includes('Not Found')) {
    return 'The requested resource was not found.';
  }
  if (message.includes('500') || message.includes('Internal Server Error')) {
    return 'Something went wrong on our server. Please try again later.';
  }
  if (message.includes('ECONNREFUSED') || message.includes('NetworkError')) {
    return 'Cannot connect to the server. Please check your internet connection.';
  }
  return message || 'An unexpected error occurred. Please try again.';
}

export default function Products() {
  const navigate = useNavigate()
  const { user } = useAuth()
  const [products, setProducts] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [filter, setFilter] = useState('All')
  const [search, setSearch] = useState('')
  const [openMenu, setOpenMenu] = useState(null)
  const [categories, setCategories] = useState(['All', 'T-Shirt', 'Cap', 'Hoodie', 'Bag'])
  const [menuPosition, setMenuPosition] = useState({ top: 0, left: 0 })
  const buttonRefs = useRef({})
  
  const [uiError, setUiError] = useState(null)
  const [deleteModal, setDeleteModal] = useState({ isOpen: false, productId: null, productName: '' })
  const [isDeleting, setIsDeleting] = useState(false)

  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [totalItems, setTotalItems] = useState(0)
  const [hasNextPage, setHasNextPage] = useState(false)
  const [hasPreviousPage, setHasPreviousPage] = useState(false)
  const [pageSize, setPageSize] = useState(PAGE_SIZE)

  const defaultCategories = ['All', 'T-Shirt', 'Cap', 'Hoodie', 'Bag']

  const isObjectId = (value) => {
    if (!value || typeof value !== 'string') return false
    return /^[0-9a-fA-F]{24}$/.test(value)
  }

  // ─── FIXED: Normalize product type names ───
  const normalizeTypeName = (type) => {
    if (!type) return null
    
    // Convert to string and trim
    let normalized = String(type).trim()
    
    // Handle common variations
    const typeMap = {
      'tshirt': 'T-Shirt',
      't-shirt': 'T-Shirt',
      't shirt': 'T-Shirt',
      'hoodie': 'Hoodie',
      'hoody': 'Hoodie',
      'cap': 'Cap',
      'hat': 'Cap',
      'bag': 'Bag',
      'tote': 'Bag',
      'backpack': 'Bag',
    }
    
    // Check if it matches any known variations (case insensitive)
    const lowerType = normalized.toLowerCase()
    if (typeMap[lowerType]) {
      return typeMap[lowerType]
    }
    
    // If it's a known type with different casing, return the proper format
    const knownTypes = ['T-Shirt', 'Hoodie', 'Cap', 'Bag']
    for (const known of knownTypes) {
      if (lowerType === known.toLowerCase()) {
        return known
      }
    }
    
    // Otherwise, capitalize first letter and return as-is
    return normalized.charAt(0).toUpperCase() + normalized.slice(1).toLowerCase()
  }

  // ─── FIXED: Better product type detection with normalization ───
  const getProductTypeName = (product) => {
    let type = null
    
    // Try multiple places where the type might be stored
    
    // 1. Direct productType field (not an ObjectId)
    if (product.productType && !isObjectId(product.productType)) {
      type = product.productType
    }
    
    // 2. Product object's productType
    else if (product.product?.productType && !isObjectId(product.product.productType)) {
      type = product.product.productType
    }
    
    // 3. productTypeId from the product object with mapping
    else if (product.product?.productTypeId) {
      const typeMap = {
        '6a7094d9ccc599c16bea46d7': 'T-Shirt',
        '6a747ba83427b9d628f80375': 'Hoodie',
        '6a747c7b3427b9d628f8037b': 'Hoodie',
        '6a747d0f3427b9d628f80387': 'Bag',
        '6a74a16b3427b9d628f80392': 'T-Shirt',
        '6a7f3c6216995eaa4c0e71b2': 'Hoodie',
        '6a82eb283daf2628ab4807fa': 'T-Shirt',
      }
      type = typeMap[product.product.productTypeId]
    }
    
    // 4. Direct type field
    else if (product.type && !isObjectId(product.type)) {
      type = product.type
    }
    
    // 5. category field
    else if (product.category && !isObjectId(product.category)) {
      type = product.category
    }
    
    // 6. Check if productType is an ObjectId that we can map
    else if (product.productType && isObjectId(product.productType)) {
      const typeMap = {
        '6a7094d9ccc599c16bea46d7': 'T-Shirt',
        '6a747ba83427b9d628f80375': 'Hoodie',
        '6a747c7b3427b9d628f8037b': 'Hoodie',
        '6a747d0f3427b9d628f80387': 'Bag',
        '6a74a16b3427b9d628f80392': 'T-Shirt',
        '6a7f3c6216995eaa4c0e71b2': 'Hoodie',
        '6a82eb283daf2628ab4807fa': 'T-Shirt',
      }
      type = typeMap[product.productType]
    }
    
    // 7. Check nested productTypeId
    else if (product.productTypeId && isObjectId(product.productTypeId)) {
      const typeMap = {
        '6a7094d9ccc599c16bea46d7': 'T-Shirt',
        '6a747ba83427b9d628f80375': 'Hoodie',
        '6a747c7b3427b9d628f8037b': 'Hoodie',
        '6a747d0f3427b9d628f80387': 'Bag',
        '6a74a16b3427b9d628f80392': 'T-Shirt',
        '6a7f3c6216995eaa4c0e71b2': 'Hoodie',
        '6a82eb283daf2628ab4807fa': 'T-Shirt',
      }
      type = typeMap[product.productTypeId]
    }
    
    // 8. If product has variant type
    else if (product.variantType) {
      type = product.variantType
    }
    
    // If we found a type, normalize it
    if (type) {
      return normalizeTypeName(type)
    }
    
    return null
  }

  const getCampaignName = (product) => {
    if (product.campaign?.campaignName) return product.campaign.campaignName
    if (product.campaign?.name) return product.campaign.name
    if (product.campaignName) return product.campaignName
    if (product.campaignId) return 'Campaign ID: ' + product.campaignId
    return '-'
  }

  const fetchProducts = async (page = 1) => {
    try {
      setLoading(true)
      setError(null)
      setUiError(null)
      const response = await productAPI.getAll(page, PAGE_SIZE)
      console.log('📦 Products fetched:', response)
      
      let productList = []
      if (response.data && Array.isArray(response.data)) {
        productList = response.data
      } else if (Array.isArray(response)) {
        productList = response
      } else if (response?.data?.products) {
        productList = response.data.products
      } else {
        productList = response || []
      }
      
      setProducts(productList)
      const pagination = response.pagination || {}
      setCurrentPage(pagination.page || 1)
      setTotalPages(pagination.totalPages || 1)
      setTotalItems(pagination.total || productList.length)
      setHasNextPage(pagination.hasNextPage || false)
      setHasPreviousPage(pagination.hasPreviousPage || false)
      setPageSize(pagination.limit || PAGE_SIZE)
    } catch (err) {
      console.error('Error fetching products:', err)
      const friendlyMessage = parseErrorMessage(err)
      setError(friendlyMessage)
      setUiError(friendlyMessage)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchProducts(1)
  }, [])

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (openMenu && !e.target.closest('.dropdown-menu') && !e.target.closest('.dropdown-trigger')) {
        setOpenMenu(null)
      }
    }
    document.addEventListener('click', handleClickOutside)
    return () => document.removeEventListener('click', handleClickOutside)
  }, [openMenu])

  // ─── FIXED: Populate categories from products with deduplication ───
  useEffect(() => {
    if (products.length > 0) {
      // Get unique product types from all products
      const uniqueTypes = new Set()
      
      products.forEach(p => {
        const typeName = getProductTypeName(p)
        if (typeName && typeName !== '-' && !isObjectId(typeName)) {
          // The type is already normalized by getProductTypeName
          uniqueTypes.add(typeName)
        }
      })
      
      // Start with default categories (excluding 'All')
      const defaultTypes = defaultCategories.slice(1) // ['T-Shirt', 'Cap', 'Hoodie', 'Bag']
      
      // Combine defaults with unique types from products
      const allTypes = new Set([...defaultTypes, ...Array.from(uniqueTypes)])
      
      // Convert to array and sort alphabetically
      const sortedTypes = Array.from(allTypes).sort()
      
      // Add 'All' at the beginning
      const allCategories = ['All', ...sortedTypes]
      
      console.log('📋 Categories generated:', allCategories)
      console.log('📋 Unique types found:', Array.from(uniqueTypes))
      setCategories(allCategories)
    } else {
      setCategories(defaultCategories)
    }
  }, [products])

  useEffect(() => {
    fetchProducts(1)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filter])

  const handlePageChange = (newPage) => {
    if (newPage < 1 || newPage > totalPages) return
    setCurrentPage(newPage)
    fetchProducts(newPage)
    setOpenMenu(null)
  }

  const confirmDelete = (id, name) => {
    setUiError(null)
    setDeleteModal({ isOpen: true, productId: id, productName: name || 'this product' })
    setOpenMenu(null)
  }

  const handleDelete = async () => {
    const { productId } = deleteModal
    if (!productId) return
    setIsDeleting(true)
    setUiError(null)
    try {
      await productAPI.delete(productId)
      await fetchProducts(currentPage)
      setDeleteModal({ isOpen: false, productId: null, productName: '' })
    } catch (err) {
      console.error('Error deleting product:', err)
      const friendlyMessage = parseErrorMessage(err)
      setUiError(friendlyMessage)
    } finally {
      setIsDeleting(false)
    }
  }

  const closeDeleteModal = () => {
    setDeleteModal({ isOpen: false, productId: null, productName: '' })
  }

  // ─── FIXED: Improved filtering logic ───
  const filteredProducts = products.filter(p => {
    const productName = p.product?.productName || p.productName || p.name || ''
    const productType = getProductTypeName(p) || ''
    const description = p.product?.description || p.description || ''
    const sku = p.sku || p.product?.productCode || p.productCode || ''
    const campaignName = getCampaignName(p)
    
    // Filter by type (case insensitive)
    let matchesFilter = true
    if (filter !== 'All') {
      // Normalize both for comparison
      const normalizedFilter = filter.toLowerCase()
      const normalizedType = productType.toLowerCase()
      matchesFilter = normalizedType === normalizedFilter
    }
    
    // Search filter
    const matchesSearch = 
      productName.toLowerCase().includes(search.toLowerCase()) ||
      description.toLowerCase().includes(search.toLowerCase()) ||
      sku.toLowerCase().includes(search.toLowerCase()) ||
      campaignName.toLowerCase().includes(search.toLowerCase()) ||
      productType.toLowerCase().includes(search.toLowerCase())
    
    return matchesFilter && matchesSearch
  })

  const openDropdown = (id, e) => {
    const target = e?.currentTarget || buttonRefs.current[id]
    
    if (!target) {
      setMenuPosition({ top: window.innerHeight / 2 - 50, left: window.innerWidth / 2 - 65 })
      setOpenMenu(id)
      return
    }

    const rect = target.getBoundingClientRect()
    const dropdownWidth = 160
    const dropdownHeight = 120
    
    let left = rect.right - dropdownWidth
    let top = rect.bottom + 4

    if (left < 10) left = 10
    if (left + dropdownWidth > window.innerWidth - 10) left = window.innerWidth - dropdownWidth - 10
    if (top + dropdownHeight > window.innerHeight - 10) top = rect.top - dropdownHeight - 4
    if (top < 10) top = 10

    setMenuPosition({ top, left })
    setOpenMenu(openMenu === id ? null : id)
  }

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px]">
        <Loader2 size={40} className="text-primary animate-spin mb-4" />
        <p className="text-gray-500">Loading products...</p>
      </div>
    )
  }

  if (error && !uiError) {
    return <ServerError onRetry={() => fetchProducts(currentPage)} />
  }

  // Get the user's first name for the greeting
  const getUserName = () => {
    if (user?.firstName) return user.firstName
    if (user?.name) return user.name.split(' ')[0]
    if (user?.email) return user.email.split('@')[0]
    return 'User'
  }

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Products</h1>
          <p className="text-gray-500 text-sm">
            Hey {getUserName()} 👋, Manage your merch & NFC-linked items
          </p>
        </div>
        <button onClick={() => navigate('/dashboard/products/add')} className="btn-primary w-auto px-5">
          <Plus size={16} /> Add Product
        </button>
      </div>

      {uiError && (
        <div className="mb-4 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl flex items-start gap-3">
          <AlertCircle size={20} className="shrink-0 mt-0.5 text-red-500" />
          <div className="flex-1">
            <p className="text-sm font-medium">{uiError}</p>
            <button 
              onClick={() => setUiError(null)}
              className="text-xs text-red-600 hover:text-red-800 mt-1 font-medium"
            >
              Dismiss
            </button>
          </div>
        </div>
      )}

      {/* ─── FILTER BUTTONS ─── */}
      <div className="flex flex-wrap items-center gap-2 mb-5">
        {categories.map((cat) => (
          <button
            key={cat}
            onClick={() => setFilter(cat)}
            className={`px-4 py-1.5 text-sm font-medium rounded-full transition-all ${
              filter === cat 
                ? 'bg-yellow-500 text-white shadow-sm' 
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            {cat}
          </button>
        ))}
        
        <div className="relative ml-auto">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input 
            value={search} 
            onChange={e => {
              setSearch(e.target.value)
              if (currentPage !== 1) {
                setCurrentPage(1)
                fetchProducts(1)
              }
            }} 
            placeholder="Search products..." 
            className="input-field pl-9 w-56" 
          />
        </div>
      </div>

      {filteredProducts.length === 0 ? (
        <EmptyState 
          icon={<Package size={40} className="text-gray-300" />}
          title={search || filter !== 'All' ? 'No products found' : 'No products yet'} 
          description={search || filter !== 'All' ? 'Try adjusting your filters or search term.' : 'Add your first NFC-linked product to start tracking taps and managing campaigns.'} 
          action={() => navigate('/dashboard/products/add')} 
          actionLabel="Add Product" 
        />
      ) : (
        <>
          <div className="card p-0 overflow-x-auto overflow-y-visible">
            <table className="w-full text-sm min-w-[900px]">
              <thead className="bg-gray-50/50">
                <tr className="text-gray-400 text-xs font-medium">
                  {['Product','Type','Color','Size','SKU','Campaign','Product ID','Scans','Tag ID',''].map(h => (
                    <th key={h} className="text-left px-4 py-3.5 whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {filteredProducts.map((p, i) => {
                  const productObj = p.product || p
                  const productId = p.productId || p._id || i
                  const variantId = p._id || i
                  
                  const productName = productObj.productName || p.productName || 'Unnamed Product'
                  const productType = getProductTypeName(p) || '-'
                  const color = p.colorId || p.color || '-'
                  const size = p.sizeId || p.size || '-'
                  const sku = p.sku || productObj.productCode || '-'
                  const campaignName = getCampaignName(p)
                  const scans = p.scans || p.taps || 0
                  const tagId = p.tagId || p.tag || '-'
                  
                  const actionId = p._id || p.id || productId

                  return (
                    <tr key={actionId} className="hover:bg-gray-50/40">
                      <td className="px-4 py-3 font-medium text-gray-800 whitespace-nowrap">{productName}</td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${
                          productType === 'T-Shirt' ? 'bg-blue-50 text-blue-700' :
                          productType === 'Hoodie' ? 'bg-purple-50 text-purple-700' :
                          productType === 'Cap' ? 'bg-green-50 text-green-700' :
                          productType === 'Bag' ? 'bg-yellow-50 text-yellow-700' :
                          'bg-gray-50 text-gray-700'
                        }`}>
                          {productType}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-gray-500">{color}</td>
                      <td className="px-4 py-3 text-gray-500">{size}</td>
                      <td className="px-4 py-3 text-gray-500">{sku}</td>
                      <td className="px-4 py-3 text-gray-500 whitespace-nowrap">{campaignName}</td>
                      <td className="px-4 py-3 text-gray-500">{productId}</td>
                      <td className="px-4 py-3 text-gray-700">{typeof scans === 'number' ? scans.toLocaleString() : '0'}</td>
                      <td className="px-4 py-3 text-gray-500">{tagId}</td>
                      <td className="px-4 py-3 text-right relative">
                        <button 
                          ref={(el) => { buttonRefs.current[actionId] = el }}
                          onClick={(e) => openDropdown(actionId, e)}
                          className="dropdown-trigger p-1 hover:bg-gray-100 rounded-lg inline-flex items-center justify-center"
                        >
                          <MoreHorizontal size={16} className="text-gray-400" />
                        </button>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>

          <div className="flex items-center justify-between px-4 py-3 bg-white border-t border-gray-100">
            <p className="text-xs text-gray-500">
              Showing <span className="font-medium">{((currentPage - 1) * pageSize) + 1}</span> to{' '}
              <span className="font-medium">{Math.min(currentPage * pageSize, totalItems)}</span> of{' '}
              <span className="font-medium">{totalItems}</span> products
            </p>
            <div className="flex items-center gap-2">
              <button
                onClick={() => handlePageChange(currentPage - 1)}
                disabled={!hasPreviousPage}
                className="px-4 py-2 text-sm font-medium text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
              >
                Previous
              </button>
              <span className="text-sm font-medium text-gray-700 px-2">Page {currentPage} of {totalPages}</span>
              <button
                onClick={() => handlePageChange(currentPage + 1)}
                disabled={!hasNextPage}
                className="px-4 py-2 text-sm font-medium text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
              >
                Next
              </button>
            </div>
          </div>
        </>
      )}

      {openMenu !== null && (
        <>
          <div className="fixed inset-0 z-[997]" onClick={() => setOpenMenu(null)} />
          <div className="dropdown-menu fixed bg-white border border-gray-200 rounded-xl shadow-lg z-[999] py-1 min-w-[160px]" style={{ top: menuPosition.top, left: menuPosition.left }}>
            <button onClick={() => { const product = products.find(p => p._id === openMenu); setOpenMenu(null); if (product) { const productId = product.productId || product._id; navigate(`/dashboard/products/edit/${productId}`) } }} className="flex items-center gap-2 w-full px-4 py-2.5 text-sm text-primary hover:bg-gray-50 font-medium">
              <Pencil size={13} /> Edit
            </button>
            <button onClick={() => { const product = products.find(p => p._id === openMenu); setOpenMenu(null); if (product) { const productId = product.productId || product._id; navigate(`/dashboard/products/assign/${productId}`) } }} className="flex items-center gap-2 w-full px-4 py-2.5 text-sm text-primary hover:bg-gray-50 font-medium">
              <Link size={13} /> Assign to Campaign
            </button>
            <button onClick={() => { const product = products.find(p => p._id === openMenu); setOpenMenu(null); if (product) { const productId = product.productId || product._id; const name = product.product?.productName || product.productName || 'this product'; confirmDelete(productId, name) } }} className="flex items-center gap-2 w-full px-4 py-2.5 text-sm text-red-500 hover:bg-red-50 font-medium">
              <Trash2 size={13} /> Delete
            </button>
          </div>
        </>
      )}

      {deleteModal.isOpen && (
        <div className="fixed inset-0 bg-black/50 z-[999] flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-xl font-bold text-gray-900">Delete Product</h2>
              <button onClick={closeDeleteModal} className="p-1.5 hover:bg-gray-100 rounded-lg" disabled={isDeleting}>
                <X size={20} className="text-gray-500" />
              </button>
            </div>
            <div className="flex justify-center mb-4">
              <div className="w-16 h-16 bg-red-50 rounded-full flex items-center justify-center">
                <Trash2 size={32} className="text-red-500" />
              </div>
            </div>
            <p className="text-center text-gray-600 mb-6">
              Are you sure you want to delete <span className="font-semibold text-gray-900">"{deleteModal.productName}"</span>? This action cannot be undone.
            </p>
            <div className="flex gap-3">
              <button onClick={closeDeleteModal} disabled={isDeleting} className="flex-1 px-4 py-2.5 text-sm font-medium text-gray-700 bg-gray-100 rounded-xl hover:bg-gray-200 transition-all disabled:opacity-50">
                Cancel
              </button>
              <button onClick={handleDelete} disabled={isDeleting} className="flex-1 px-4 py-2.5 text-sm font-medium text-white bg-red-500 rounded-xl hover:bg-red-600 transition-all disabled:opacity-50 flex items-center justify-center gap-2">
                {isDeleting ? (<><Loader2 size={18} className="animate-spin" /> Deleting...</>) : (<><Trash2 size={16} /> Delete</>)}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}