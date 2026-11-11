
package com.supplychain.controller;

import java.util.List;
import java.util.Map;


import jakarta.servlet.http.HttpServletRequest;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContext;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.context.HttpSessionSecurityContextRepository;
import org.springframework.web.bind.annotation.*;
import com.supplychain.service.CustomerOrderService;

import org.springframework.security.core.Authentication;

import com.supplychain.entity.CustomerOrder;

import com.supplychain.entity.Customer;
import com.supplychain.service.CustomerService;

@RestController
@RequestMapping("/api/customers")
public class CustomerController {

    private final CustomerService customerService;
    private final PasswordEncoder passwordEncoder;
    private final CustomerOrderService customerOrderService;

    public CustomerController(
            CustomerService customerService,
            PasswordEncoder passwordEncoder,
            CustomerOrderService customerOrderService) {

        this.customerService = customerService;
        this.passwordEncoder = passwordEncoder;
        this.customerOrderService = customerOrderService;
    }

    @PostMapping("/register")
    public ResponseEntity<?> registerCustomer(
            @RequestBody Customer customer) {
        try {
            Customer savedCustomer =
                    customerService.registerCustomer(customer);

            savedCustomer.setPassword(null);

            return ResponseEntity
                    .status(HttpStatus.CREATED)
                    .body(savedCustomer);

        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest()
                    .body(e.getMessage());
        }
    }


@PostMapping("/login")
public ResponseEntity<?> loginCustomer(
        @RequestBody Customer customer,
        HttpServletRequest request) {

    try {
        Customer existingCustomer =
            customerService.getCustomerByEmail(customer.getEmail());

        if (customer.getPassword() == null ||
                !passwordEncoder.matches(
                    customer.getPassword(),
                    existingCustomer.getPassword())) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body("Invalid email or password");
        }

        // Clear the previous login session after validation.
        SecurityContextHolder.clearContext();

        if (request.getSession(false) != null) {
            request.getSession(false).invalidate();
        }

        var authentication =
            new UsernamePasswordAuthenticationToken(
                existingCustomer.getEmail(),
                null,
                List.of(new SimpleGrantedAuthority("ROLE_CUSTOMER"))
            );

        SecurityContext context =
            SecurityContextHolder.createEmptyContext();
        context.setAuthentication(authentication);
        SecurityContextHolder.setContext(context);

        request.getSession(true).setAttribute(
            HttpSessionSecurityContextRepository.SPRING_SECURITY_CONTEXT_KEY,
            context
        );

        return ResponseEntity.ok(Map.of(
            "message", "Customer login successful",
            "id", existingCustomer.getId(),
            "name", existingCustomer.getName(),
            "email", existingCustomer.getEmail(),
            "role", "CUSTOMER"
        ));

    } catch (IllegalArgumentException e) {
        return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                .body("Invalid email or password");
    }
}


    // Place an order for the logged-in customer
    @PostMapping("/orders")
    public ResponseEntity<?> placeCustomerOrder(
            @RequestBody CustomerOrder order,
            Authentication authentication) {

        try {
            CustomerOrder savedOrder =
                    customerOrderService.addCustomerOrder(
                            order, authentication.getName());

            return ResponseEntity
                    .status(HttpStatus.CREATED)
                    .body(savedOrder);

        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest()
                    .body(e.getMessage());
        }
    }

    // View only the logged-in customer's orders
    @GetMapping("/orders")
    public ResponseEntity<List<CustomerOrder>> getMyOrders(
            Authentication authentication) {

        List<CustomerOrder> orders =
                customerOrderService.getCustomerOrders(
                        authentication.getName());

        return ResponseEntity.ok(orders);
    }

    // Cancel an order belonging to the logged-in customer
    @DeleteMapping("/orders/{id}")
    public ResponseEntity<?> cancelMyOrder(
            @PathVariable Long id,
            Authentication authentication) {

        try {
            boolean cancelled =
                    customerOrderService.cancelCustomerOrder(
                            id, authentication.getName());

            if (!cancelled) {
                return ResponseEntity.status(HttpStatus.NOT_FOUND)
                        .body("Order not found");
            }

            return ResponseEntity.ok(
                    Map.of("message", "Order cancelled successfully"));

        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }


}
