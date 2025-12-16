import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { MOCK_PRODUCTS } from '../constants';
import { Product } from '../types';
import Button from './Button';
import Card from './Card';
import ParallaxSection from './ParallaxSection';
import { FaCheckCircle } from 'react-icons/fa';
import { useLanguage } from '../contexts/LanguageContext';
import { useEditor } from '../contexts/EditorContext';
import EditablePage from './editor/EditablePage';
import EditableField from './editor/EditableField';
import cmsService from '../services/cmsService';
import { EditorPageContent } from '../services/cmsEditorService';

const ProductCard: React.FC<{ product: Product; editorContext?: any }> = ({
  product,
  editorContext
}) => {
  const { t } = useLanguage();
  const isEditMode = editorContext?.isEditMode || false;
  
  // Helper function to render editable content safely
  const renderEditable = (fieldKey: string, defaultValue: string, containerClass: string = "", isImage: boolean = false) => {
    if (isEditMode) {
      return (
        <EditableField
          fieldKey={fieldKey}
          defaultValue={defaultValue}
          className={containerClass}
          editorContext={editorContext}
        />
      );
    }
    
    if (isImage) {
      // Custom image rendering with reliable fallbacks
      const imageUrl = product.id === 'prod_1'
        ? 'https://images.unsplash.com/photo-1590283603385-17ffb3a7f29f?auto=format&fit=crop&w=800'
        : 'https://images.unsplash.com/photo-1621405788930-bcee940d0783?auto=format&fit=crop&w=800';
        
      return (
        <img
          src={imageUrl}
          alt={`${t(product.name)}`}
          className={containerClass}
          loading="eager"
          onError={(e) => {
            console.log('Image failed to load, using fallback');
            e.currentTarget.src = 'https://images.unsplash.com/photo-1590283603385-17ffb3a7f29f?auto=format&fit=crop&w=800';
          }}
        />
      );
    }
    
    return <span className={containerClass}>{defaultValue}</span>;
  };
  
  return (
    <Card className="flex flex-col h-full transform hover:scale-105 transition-transform duration-300 bg-light-card dark:bg-dark-card" id={product.id}>
      {product.imageUrl && (
        <div className="w-full h-56">
          {renderEditable(`product_${product.id}_image`, product.imageUrl, "w-full h-56 object-cover", true)}
        </div>
      )}
      <div className="p-6 flex-grow">
        <h3 className="text-2xl font-bold text-light-accent dark:text-dark-accent mb-3">
          {renderEditable(`product_${product.id}_name`, t(product.name))}
        </h3>
        <div className="text-light-text-secondary dark:text-dark-text-secondary mb-4">
          {renderEditable(`product_${product.id}_description`, t(product.description))}
        </div>
        
        <h4 className="text-lg font-semibold text-light-text dark:text-dark-text mt-6 mb-2">
          {renderEditable("product_benefits_title", t('product.keyBenefits'))}
        </h4>
        <ul className="space-y-1 text-light-text-secondary dark:text-dark-text-secondary mb-6">
          {product.benefits.map((benefitKey, index) => (
            <li key={index} className="flex items-center">
              <FaCheckCircle className="text-light-positive dark:text-dark-positive mr-2 flex-shrink-0" />
              {renderEditable(`product_${product.id}_benefit_${index}`, t(benefitKey))}
            </li>
          ))}
        </ul>

        <h4 className="text-lg font-semibold text-light-text dark:text-dark-text mt-6 mb-2">
          {renderEditable("product_pricing_title", t('product.pricingTiers'))}
        </h4>
        <div className="space-y-4">
          {product.pricing.map((tier, index) => (
            <div key={index} className="border border-light-border dark:border-dark-border p-4 rounded-md bg-light-bg dark:bg-dark-bg">
              <h5 className="font-semibold text-light-accent dark:text-dark-accent">
                {renderEditable(`product_${product.id}_pricing_${index}_tier`, t(tier.tier))}
                {" - "}
                <span className="text-light-text dark:text-dark-text font-normal">
                  {renderEditable(`product_${product.id}_pricing_${index}_price`, tier.price)}
                </span>
              </h5>
              <ul className="list-disc list-inside text-xs text-light-text-secondary dark:text-dark-text-secondary mt-1">
                {tier.features.map((featureKey, fIndex) => (
                  <li key={fIndex}>
                    {renderEditable(`product_${product.id}_pricing_${index}_feature_${fIndex}`, t(featureKey))}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>
      <div className="p-6 mt-auto border-t border-light-border dark:border-dark-border">
        <Link to="/register">
          <Button variant="secondary" fullWidth>
            {renderEditable(`product_${product.id}_cta`, t('product.getStartedWith', { productName: t(product.name) }))}
          </Button>
        </Link>
      </div>
    </Card>
  );
};

// Create mock content for the products page
const mockProductsPageContent: EditorPageContent = {
  id: "products-page",
  contentTypeId: "page-content-type",
  contentTypeSlug: "page",
  title: "Products Page",
  slug: "products",
  status: "draft",
  fields: [
    {
      id: "products_page_title",
      key: "products_page_title",
      name: "Page Title",
      type: "text",
      value: "Our Trading Bot Solutions",
      isRequired: false
    },
    {
      id: "products_page_subtitle",
      key: "products_page_subtitle",
      name: "Page Subtitle",
      type: "text",
      value: "Explore our range of AI-powered trading bots, designed for performance and ease of use.",
      isRequired: false
    },
    {
      id: "products_page_image",
      key: "products_page_image",
      name: "Hero Image",
      type: "image",
      value: "https://images.unsplash.com/photo-1590283603385-17ffb3a7f29f?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxzZWFyY2h8Nnx8Y3J5cHRvfGVufDB8fDB8fA%3D%3D&auto=format&fit=crop&w=1200&q=70",
      isRequired: false
    }
  ]
};

const ProductsPage: React.FC = () => {
  const { t } = useLanguage();
  const { editorState, setEditMode, toggleEditMode } = useEditor();
  const [products, setProducts] = useState<Product[]>(MOCK_PRODUCTS);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [pageContent, setPageContent] = useState<EditorPageContent>(mockProductsPageContent);
  const [showError, setShowError] = useState<boolean>(true);
  const [localEditMode, setLocalEditMode] = useState<boolean>(false);
  
  // Sync local edit mode with editor state
  useEffect(() => {
    setLocalEditMode(editorState.isEditMode);
    console.log("Edit mode changed:", editorState.isEditMode);
  }, [editorState.isEditMode]);
  
  // Fetch products from CMS
  useEffect(() => {
    const fetchProducts = async () => {
      setIsLoading(true);
      try {
        const cmsProducts = await cmsService.getProducts();
        if (cmsProducts && cmsProducts.length > 0) {
          // Transform CMS products to our Product type
          const transformedProducts = cmsProducts.map(cmsProduct => {
            const fieldValues = cmsProduct.fieldValues || {};
            return {
              id: cmsProduct.id,
              name: fieldValues.name || cmsProduct.title,
              description: fieldValues.description || '',
              imageUrl: fieldValues.imageUrl || '',
              benefits: fieldValues.benefits ? JSON.parse(fieldValues.benefits) : [],
              pricing: fieldValues.pricing ? JSON.parse(fieldValues.pricing) : []
            } as Product;
          });
          setProducts(transformedProducts);
        }
      } catch (error) {
        console.error('Error fetching products:', error);
        // Fallback to mock data
        setProducts(MOCK_PRODUCTS);
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchProducts();
  }, []);

  // Handle content loaded from CMS - use mock data if CMS connection fails
  const handleContentLoaded = (content: EditorPageContent) => {
    try {
      // If we successfully loaded content from CMS, use it
      setPageContent(content);
    } catch (error) {
      console.warn("Using mock content for products page:", error);
      // Keep using mock content
      setPageContent(mockProductsPageContent);
    }
  };
  
  // Function to update field values
  const updateFieldValue = (key: string, value: any) => {
    console.log(`Updating field ${key} with value:`, value);
    const updatedFields = pageContent.fields.map(field =>
      field.key === key ? {...field, value} : field
    );
    setPageContent({...pageContent, fields: updatedFields});
  };

  // Helper function to get field value
  const getFieldValue = (key: string) => {
    const field = pageContent.fields.find(f => f.key === key);
    return field ? field.value : '';
  };

  // Auto-dismiss error after loading and permanently hide it
  useEffect(() => {
    // Set a timer to auto-dismiss the error after 2 seconds
    const timer = setTimeout(() => {
      setShowError(false);
      // Also store in localStorage that we've dismissed this error
      localStorage.setItem('products_error_dismissed', 'true');
    }, 2000);
    
    // Check if we've already dismissed this error before
    const alreadyDismissed = localStorage.getItem('products_error_dismissed') === 'true';
    if (alreadyDismissed) {
      setShowError(false);
    }
    
    // Clear the timer on component unmount
    return () => clearTimeout(timer);
  }, []);
  
  // Function to dismiss the error permanently
  const dismissError = () => {
    setShowError(false);
    localStorage.setItem('products_error_dismissed', 'true');
  };

  return (
    <div className="relative">
      {/* Custom error banner that can be dismissed */}
      {showError && (
        <div className="fixed top-20 right-4 z-50 bg-light-negative dark:bg-dark-negative text-white p-4 rounded-md shadow-lg max-w-sm animate-fade-in">
          <div className="flex justify-between items-center">
            <p>Failed to load page content. Using mock data instead.</p>
            <button
              className="ml-4 text-white hover:text-gray-200"
              onClick={dismissError}
            >
              ✕
            </button>
          </div>
        </div>
      )}
      {/* Add debug controls for testing */}
      <div className="bg-light-card dark:bg-dark-card rounded-lg shadow-md p-4 mb-4">
        <div className="flex justify-between items-center mb-2">
          <h3 className="text-xl font-bold">WYSIWYG Editor Controls</h3>
          <div className="flex items-center">
            <span className="mr-2 text-sm px-2 py-1 rounded bg-light-info dark:bg-dark-info">
              {editorState.isEditMode ? '✓ Edit Mode ON' : '✗ Edit Mode OFF'}
            </span>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => {
              console.log("Toggling edit mode from:", localEditMode);
              // Use direct state manipulation for UI updates in addition to context update
              setLocalEditMode(!localEditMode);
              toggleEditMode();
            }}
            className={`px-4 py-2 text-white rounded ${localEditMode
              ? 'bg-light-negative dark:bg-dark-negative hover:bg-red-600'
              : 'bg-light-accent dark:bg-dark-accent hover:bg-blue-600'}`}
          >
            {localEditMode ? 'Exit Edit Mode' : 'Enter Edit Mode'}
          </button>
          <span className="ml-4 text-sm text-light-text-secondary dark:text-dark-text-secondary">
            No backend connection needed - using mock data
          </span>
          <div className="ml-4 px-3 py-1 rounded bg-light-info dark:bg-dark-info flex items-center gap-2">
            <div className={`w-3 h-3 rounded-full ${localEditMode ? 'bg-green-500' : 'bg-red-500'}`}></div>
            <span className="text-sm font-medium">
              Edit Mode: {localEditMode ? 'ON' : 'OFF'}
            </span>
          </div>
        </div>
      </div>

      {/* Use custom controls instead of built-in toolbar */}
      <EditablePage
        contentId="products-page"
        contentTypeSlug="page"
        onLoad={handleContentLoaded}
        hideToolbar={true}
      >
      <div className="animate-fade-in-up">
        <ParallaxSection
          imageUrl={getFieldValue('products_page_image') || "https://images.unsplash.com/photo-1590283603385-17ffb3a7f29f?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxzZWFyY2h8Nnx8Y3J5cHRvfGVufDB8fDB8fA%3D%3D&auto=format&fit=crop&w=1200&q=70"}
          minHeight="min-h-[40vh]"
          overlayOpacity={0.7}
        >
          {/* Using separate containers to avoid nesting issues */}
          <h1 className="text-5xl font-bold text-white">
            {localEditMode ? (
              <EditableField
                fieldKey="products_page_title"
                defaultValue={t('productsPage.title', {defaultValue: "Our Trading Bot Solutions"})}
                editorContext={{
                  isEditMode: localEditMode, // Use local state instead of global for consistency
                  pageContent,
                  updateFieldValue
                }}
              />
            ) : (
              getFieldValue('products_page_title') || t('productsPage.title', {defaultValue: "Our Trading Bot Solutions"})
            )}
          </h1>
          {/* Using div instead of p to avoid HTML nesting issues */}
          <div className="text-xl text-gray-200 mt-4 max-w-2xl">
            {localEditMode ? (
              <EditableField
                fieldKey="products_page_subtitle"
                defaultValue={t('productsPage.subtitle', {defaultValue: "Explore our range of AI-powered trading bots, designed for performance and ease of use."})}
                editorContext={{
                  isEditMode: localEditMode,
                  pageContent,
                  updateFieldValue
                }}
              />
            ) : (
              getFieldValue('products_page_subtitle') || t('productsPage.subtitle', {defaultValue: "Explore our range of AI-powered trading bots, designed for performance and ease of use."})
            )}
          </div>
        </ParallaxSection>

        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-16">
          {isLoading ? (
            <div className="flex justify-center items-center h-64">
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-light-accent dark:border-dark-accent"></div>
            </div>
          ) : (
            <div className="grid md:grid-cols-1 lg:grid-cols-2 gap-10">
              {products.map(product => (
                <ProductCard
                  key={product.id}
                  product={product}
                  editorContext={pageContent && localEditMode ? {
                    isEditMode: localEditMode,
                    pageContent,
                    updateFieldValue
                  } : undefined}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </EditablePage>
    </div>
  );
};

export default ProductsPage;