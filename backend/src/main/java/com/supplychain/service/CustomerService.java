
package com.supplychain.service;

import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import com.supplychain.entity.Customer;
import com.supplychain.repository.CustomerRepository;

@Service
public class CustomerService {

    private final CustomerRepository customerRepository;
    private final PasswordEncoder passwordEncoder;

    public CustomerService(
            CustomerRepository customerRepository,
            PasswordEncoder passwordEncoder) {
        this.customerRepository = customerRepository;
        this.passwordEncoder = passwordEncoder;
    }


public Customer registerCustomer(Customer customer) {
    if (customer.getName() == null || customer.getName().isBlank()) {
        throw new IllegalArgumentException("Name is required");
    }

    if (customer.getEmail() == null || customer.getEmail().isBlank()) {
        throw new IllegalArgumentException("Email is required");
    }

    if (customer.getPassword() == null || customer.getPassword().isEmpty()) {
        throw new IllegalArgumentException("Password is required");
    }

    customer.setName(customer.getName().trim());
    customer.setEmail(customer.getEmail().trim().toLowerCase());

    if (customerRepository.existsByEmail(customer.getEmail())) {
        throw new IllegalArgumentException(
            "Email is already registered"
        );
    }

    customer.setPassword(
        passwordEncoder.encode(customer.getPassword())
    );

    return customerRepository.save(customer);
}


public Customer getCustomerByEmail(String email) {
    if (email == null || email.isBlank()) {
        throw new IllegalArgumentException("Customer not found");
    }

    String normalizedEmail = email.trim().toLowerCase();

    return customerRepository.findByEmail(normalizedEmail)
            .orElseThrow(() -> new IllegalArgumentException(
                    "Customer not found"));
}
}
