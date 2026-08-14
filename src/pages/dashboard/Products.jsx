import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { Plus, Search, MoreHorizontal, Pencil, Trash2, Loader2, AlertCircle, Package, X } from 'lucide-react'
import EmptyState from '../../components/EmptyState'
import { productAPI } from '../../services/apiClient'

// ─── Professional Error Parser ──────────────────────────
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
  const [products, setProducts] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [filter, setFilter] = useState('All')
  const [search, setSearch] = useState('')
  const [openMenu, setOpenMenu] = useState(null)
  const [categories, setCategories] = useState(['All'])
  const [menuPosition, setMenuPosition] = useState({ top: 0, left: 0 })
  const buttonRefs = useRef({})
  
  const [uiError, setUiError] = useState(null)
  const [deleteModal, setDeleteModal] = useState({ isOpen: false, productId: null, productName: '' })
  const [isDeleting, setIsDeleting] = useState(false)

  // ─── Default categories ───
  const defaultCategories = ['All', 'T-Shirt', 'Cap', 'Hoodie']

  // ─── Fetch Products from API ───
  const fetchProducts = async () => {
    try {
      setLoading(true)
      setError(null)
      setUiError(null)
      const response = await productAPI.getAll()
      console.log('📦 Products fetched:', JSON.stringify(response, null, 2))
      
      let productList = []
      if (Array.isArray(response.data)) {
        productList = response.data
      } else if (Array.isArray(response)) {
        productList = response
      } else if (response.data?.products) {
        productList = response.data.products
      } else {
        productList = response || []
      }
      
      setProducts(productList)
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
    fetchProducts()
  }, [])

  // ─── Close dropdown when clicking outside ───
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (openMenu && !e.target.closest('.dropdown-menu') && !e.target.closest('.dropdown-trigger')) {
        setOpenMenu(null)
      }
    }
    document.addEventListener('click', handleClickOutside)
    return () => document.removeEventListener('click', handleClickOutside)
  }, [openMenu])

  // ─── Extract unique categories from products ───
  useEffect(() => {
    if (products.length > 0) {
      const uniqueTypes = [...new Set(products.map(p => p.productType).filter(Boolean))]
      if (uniqueTypes.length > 0) {
        setCategories(['All', ...uniqueTypes])
      } else {
        setCategories(defaultCategories)
      }
    } else {
      setCategories(defaultCategories)
    }
  }, [products])

  // ─── Delete Product ───
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
      await fetchProducts()
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

  // ─── Filter & Search ───
  const filteredProducts = products.filter(p => {
    const matchesFilter = filter === 'All' || p.productType === filter || p.productCategory === filter
    const matchesSearch = 
      (p.productName || '').toLowerCase().includes(search.toLowerCase()) ||
      (p.description || '').toLowerCase().includes(search.toLowerCase()) ||
      (p.sku || p.productCode || '').toLowerCase().includes(search.toLowerCase())
    return matchesFilter && matchesSearch
  })

  // ─── Open dropdown with position calculation ───
  const openDropdown = (id, e) => {
    const target = e?.currentTarget || buttonRefs.current[id]
    
    if (!target) {
      setMenuPosition({
        top: window.innerHeight / 2 - 50,
        left: window.innerWidth / 2 - 65,
      })
      setOpenMenu(id)
      return
    }

    const rect = target.getBoundingClientRect()
    const dropdownWidth = 130
    const dropdownHeight = 100
    
    let left = rect.right - dropdownWidth
    let top = rect.bottom + 4

    if (left < 10) {
      left = 10
    }
    if (left + dropdownWidth > window.innerWidth - 10) {
      left = window.innerWidth - dropdownWidth - 10
    }
    if (top + dropdownHeight > window.innerHeight - 10) {
      top = rect.top - dropdownHeight - 4
    }
    if (top < 10) {
      top = 10
    }

    setMenuPosition({ top, left })
    setOpenMenu(openMenu === id ? null : id)
  }

  // ─── Loading State ───
  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px]">
        <Loader2 size={40} className="text-primary animate-spin mb-4" />
        <p className="text-gray-500">Loading products...</p>
      </div>
    )
  }

  // ─── Error State ───
  if (error && !uiError) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px]">
        <AlertCircle size={40} className="text-red-500 mb-4" />
        <p className="text-red-500 mb-4 text-center max-w-md">{error}</p>
        <button onClick={fetchProducts} className="btn-primary">
          Retry
        </button>
      </div>
    )
  }

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Products</h1>
          <p className="text-gray-500 text-sm">Hey Jenny 👋, Manage your merch & NFC-linked items</p>
        </div>
        <button onClick={() => navigate('/dashboard/products/add')} className="btn-primary w-auto px-5">
          <Plus size={16} /> Add Product
        </button>
      </div>

      {/* ─── Professional UI Error Display ─── */}
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

      {/* ─── Filter Buttons ─── */}
      <div className="flex flex-wrap items-center gap-2 mb-5">
        {categories.map((cat) => (
          <button
            key={cat}
            onClick={() => setFilter(cat)}
            className={`px-4 py-1.5 text-sm font-medium rounded-full transition-all ${
              filter === cat 
                ? 'bg-primary text-white' 
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
            onChange={e => setSearch(e.target.value)} 
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
                const id = p.id || p.productId || p._id || i
                
                // ─── Get campaign name ───
                const campaignName = p.campaign?.campaignName || p.campaign?.name || p.campaignName || p.campaignId || '-'
                
                // ─── Get product type ───
                const productType = p.productType || p.type || p.productCategory || '-'
                
                // ─── Get SKU ───
                const sku = p.sku || p.productCode || p.code || '-'
                
                // ─── Get color ───
                const color = p.color || '-'
                
                // ─── Get size ───
                const size = p.size || '-'
                
                // ─── Get product ID ───
                const productIdDisplay = p.productId || p.id || p._id || '-'
                
                // ─── Get scans ───
                const scans = p.scans || p.taps || 0
                
                // ─── Get tag ID ───
                const tagId = p.tagId || p.tag || '-'

                return (
                  <tr key={id} className="hover:bg-gray-50/40">
                    <td className="px-4 py-3 font-medium text-gray-800 whitespace-nowrap">
                      {p.productName || p.name || 'Unnamed Product'}
                    </td>
                    <td className="px-4 py-3 text-gray-500">
                      {productType}
                    </td>
                    <td className="px-4 py-3 text-gray-500">
                      {color}
                    </td>
                    <td className="px-4 py-3 text-gray-500">
                      {size}
                    </td>
                    <td className="px-4 py-3 text-gray-500">
                      {sku}
                    </td>
                    <td className="px-4 py-3 text-gray-500 whitespace-nowrap">
                      {campaignName}
                    </td>
                    <td className="px-4 py-3 text-gray-500">
                      {productIdDisplay}
                    </td>
                    <td className="px-4 py-3 text-gray-700">
                      {typeof scans === 'number' ? scans.toLocaleString() : '0'}
                    </td>
                    <td className="px-4 py-3 text-gray-500">
                      {tagId}
                    </td>
                    <td className="px-4 py-3 text-right relative">
                      <button 
                        ref={(el) => { buttonRefs.current[id] = el }}
                        onClick={(e) => openDropdown(id, e)}
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
      )}

      {/* ─── FIXED POSITION DROPDOWN MENU ─── */}
      {openMenu !== null && (
        <>
          <div 
            className="fixed inset-0 z-[997]" 
            onClick={() => setOpenMenu(null)} 
          />
          <div
            className="dropdown-menu fixed bg-white border border-gray-200 rounded-xl shadow-lg z-[999] py-1 min-w-[130px]"
            style={{
              top: menuPosition.top,
              left: menuPosition.left,
            }}
          >
            <button 
              onClick={() => {
                const product = products.find(p => (p.id || p.productId || p._id) === openMenu)
                setOpenMenu(null)
                if (product) navigate(`/dashboard/products/edit/${product.id || product.productId || product._id}`)
              }}
              className="flex items-center gap-2 w-full px-4 py-2.5 text-sm text-primary hover:bg-gray-50 font-medium"
            >
              <Pencil size={13} /> Edit
            </button>
            <button 
              onClick={() => {
                const product = products.find(p => (p.id || p.productId || p._id) === openMenu)
                setOpenMenu(null)
                if (product) confirmDelete(product.id || product.productId || product._id, product.productName || product.name)
              }}
              className="flex items-center gap-2 w-full px-4 py-2.5 text-sm text-red-500 hover:bg-red-50 font-medium"
            >
              <Trash2 size={13} /> Delete
            </button>
          </div>
        </>
      )}

      {/* ─── Delete Confirmation Modal ─── */}
      {deleteModal.isOpen && (
        <div className="fixed inset-0 bg-black/50 z-[999] flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-xl font-bold text-gray-900">Delete Product</h2>
              <button
                onClick={closeDeleteModal}
                className="p-1.5 hover:bg-gray-100 rounded-lg"
                disabled={isDeleting}
              >
                <X size={20} className="text-gray-500" />
              </button>
            </div>

            <div className="flex justify-center mb-4">
              <div className="w-16 h-16 bg-red-50 rounded-full flex items-center justify-center">
                <Trash2 size={32} className="text-red-500" />
              </div>
            </div>

            <p className="text-center text-gray-600 mb-6">
              Are you sure you want to delete <span className="font-semibold text-gray-900">"{deleteModal.productName}"</span>? 
              This action cannot be undone.
            </p>

            <div className="flex gap-3">
              <button
                onClick={closeDeleteModal}
                disabled={isDeleting}
                className="flex-1 px-4 py-2.5 text-sm font-medium text-gray-700 bg-gray-100 rounded-xl hover:bg-gray-200 transition-all disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                disabled={isDeleting}
                className="flex-1 px-4 py-2.5 text-sm font-medium text-white bg-red-500 rounded-xl hover:bg-red-600 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {isDeleting ? (
                  <>
                    <Loader2 size={18} className="animate-spin" />
                    Deleting...
                  </>
                ) : (
                  <>
                    <Trash2 size={16} />
                    Delete
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}