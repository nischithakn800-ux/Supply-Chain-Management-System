
package com.supplychain.service;

import java.time.LocalDate;
import java.util.List;
import java.util.Set;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.supplychain.entity.CustomerOrder;
import com.supplychain.entity.Product;
import com.supplychain.repository.CustomerOrderRepository;
import com.supplychain.repository.ProductRepository;
import com.supplychain.entity.Customer;
import com.supplychain.repository.CustomerRepository;


@Service
public class CustomerOrderService {

    private final CustomerOrderRepository orderRepository;
    private final ProductRepository productRepository;
    private final CustomerRepository customerRepository;

    private static final Set<String> VALID_STATUSES = Set.of(
            "PENDING", "PROCESSING", "SHIPPED", "DELIVERED"
    );

    public CustomerOrderService(
            CustomerOrderRepository orderRepository,
            ProductRepository productRepository,
            CustomerRepository customerRepository) {

        this.orderRepository = orderRepository;
        this.productRepository = productRepository;
        this.customerRepository = customerRepository;
    }
    @Transactional
    public CustomerOrder addOrder(CustomerOrder order) {

        if (order.getProductId() == null) {
            throw new IllegalArgumentException("Product ID is required");
        }

        Product product = productRepository.findById(order.getProductId())
                .orElseThrow(() -> new IllegalArgumentException(
                        "Product not found with ID: " + order.getProductId()));

        if (order.getQuantity() <= 0) {
            throw new IllegalArgumentException(
                    "Order quantity must be greater than zero");
        }

        if (product.getQuantity() < order.getQuantity()) {
            throw new IllegalArgumentException(
                    "Insufficient stock. Available quantity: "
                            + product.getQuantity());
        }

        product.setQuantity(product.getQuantity() - order.getQuantity());
        productRepository.save(product);

        if (order.getOrderDate() == null) {
            order.setOrderDate(LocalDate.now());
        }

        if (order.getStatus() == null || order.getStatus().isBlank()) {
            order.setStatus("PENDING");
        } else {
            order.setStatus(validateStatus(order.getStatus()));
        }

        return orderRepository.save(order);
    }

    public List<CustomerOrder> getAllOrders() {
        return orderRepository.findAll();
    }

@Transactional
public CustomerOrder addCustomerOrder(CustomerOrder order, String email) {
    Customer customer = customerRepository.findByEmail(email)
        .orElseThrow(() ->
            new IllegalArgumentException("Customer not found"));

    order.setCustomer(customer);

    // Customers cannot choose their own order status.
    order.setStatus("PENDING");

    return addOrder(order);
}

    public List<CustomerOrder> getCustomerOrders(String email) {
        return orderRepository.findByCustomer_Email(email);
    }

@Transactional
public boolean cancelCustomerOrder(Long id, String email) {
    CustomerOrder order = orderRepository.findById(id).orElse(null);

    if (order == null) {
        return false;
    }

    if (order.getCustomer() == null ||
        !order.getCustomer().getEmail().equalsIgnoreCase(email)) {
        throw new IllegalArgumentException(
            "You can only cancel your own orders");
    }

    if (!"PENDING".equalsIgnoreCase(order.getStatus())) {
        throw new IllegalArgumentException(
            "Only pending orders can be cancelled");
    }

    return deleteOrder(id);
}


    public CustomerOrder getOrderById(Long id) {
        return orderRepository.findById(id).orElse(null);
    }

    @Transactional
    public CustomerOrder updateOrder(Long id, CustomerOrder order) {

        CustomerOrder existingOrder =
                orderRepository.findById(id).orElse(null);

        if (existingOrder == null) {
            return null;
        }

        if (order.getProductId() == null) {
            throw new IllegalArgumentException("Product ID is required");
        }

        if (order.getQuantity() <= 0) {
            throw new IllegalArgumentException(
                    "Order quantity must be greater than zero");
        }

        Product oldProduct = productRepository.findById(
                existingOrder.getProductId()).orElse(null);

        Product newProduct = productRepository.findById(
                order.getProductId()).orElseThrow(() ->
                        new IllegalArgumentException(
                                "Product not found with ID: "
                                        + order.getProductId()));

        if (oldProduct == null) {
            throw new IllegalArgumentException("Original product not found");
        }

        int availableStock = newProduct.getQuantity();

        if (oldProduct.getId().equals(newProduct.getId())) {
            availableStock += existingOrder.getQuantity();
        }

        if (availableStock < order.getQuantity()) {
            throw new IllegalArgumentException(
                    "Insufficient stock. Available quantity: "
                            + availableStock);
        }

        oldProduct.setQuantity(
                oldProduct.getQuantity() + existingOrder.getQuantity());

        newProduct.setQuantity(
                newProduct.getQuantity() - order.getQuantity());

        productRepository.save(oldProduct);

        if (!oldProduct.getId().equals(newProduct.getId())) {
            productRepository.save(newProduct);
        }

        existingOrder.setProductId(order.getProductId());
        existingOrder.setQuantity(order.getQuantity());

        if (order.getStatus() != null && !order.getStatus().isBlank()) {
            existingOrder.setStatus(validateStatus(order.getStatus()));
        }

        if (order.getOrderDate() != null) {
            existingOrder.setOrderDate(order.getOrderDate());
        }

        return orderRepository.save(existingOrder);
    }

    // Changes only the order status. Product stock is not modified.
    @Transactional
    public CustomerOrder updateOrderStatus(Long id, String status) {

        CustomerOrder order = orderRepository.findById(id).orElse(null);

        if (order == null) {
            return null;
        }

        order.setStatus(validateStatus(status));

        return orderRepository.save(order);
    }

    private String validateStatus(String status) {
        if (status == null || !VALID_STATUSES.contains(
                status.trim().toUpperCase())) {
            throw new IllegalArgumentException(
                    "Invalid status. Use PENDING, PROCESSING, SHIPPED, or DELIVERED");
        }

        return status.trim().toUpperCase();
    }


@Transactional
public boolean deleteOrder(Long id) {

    CustomerOrder order = orderRepository.findById(id).orElse(null);

    if (order == null) {
        return false;
    }

    if ("DELIVERED".equalsIgnoreCase(order.getStatus())) {
        throw new IllegalArgumentException(
            "Delivered orders cannot be deleted"
        );
    }

    Product product = productRepository.findById(order.getProductId())
            .orElse(null);

    if (product != null) {
        product.setQuantity(product.getQuantity() + order.getQuantity());
        productRepository.save(product);
    }

    orderRepository.delete(order);

    return true;
}

}
