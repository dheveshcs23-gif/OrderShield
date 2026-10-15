package com.ordershield.service;

import com.ordershield.entity.Category;
import com.ordershield.entity.Product;
import com.ordershield.exception.ResourceNotFoundException;
import com.ordershield.repository.CategoryRepository;
import com.ordershield.repository.ProductRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
public class ProductService {

    private final ProductRepository productRepository;
    private final CategoryRepository categoryRepository;

    public ProductService(ProductRepository productRepository, CategoryRepository categoryRepository) {
        this.productRepository = productRepository;
        this.categoryRepository = categoryRepository;
    }

    public List<Product> getAllProducts() {
        return productRepository.findAll();
    }

    public Product getProductById(Long id) {
        return productRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Product not found with id: " + id));
    }

    public List<Product> getProductsByCategory(String categorySlug) {
        return productRepository.findByCategorySlug(categorySlug);
    }

    public List<Category> getAllCategories() {
        return categoryRepository.findAll();
    }

    @Transactional
    public Product updateStock(Long productId, Integer newStock) {
        Product product = getProductById(productId);
        product.setStockQuantity(Math.max(0, newStock));
        return productRepository.save(product);
    }
}
