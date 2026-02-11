package com.enterprise.fast.controller;

import com.enterprise.fast.dto.request.CreateFastProblemRequest;
import com.enterprise.fast.dto.request.StatusUpdateRequest;
import com.enterprise.fast.dto.request.UpdateFastProblemRequest;
import com.enterprise.fast.dto.response.FastProblemResponse;
import com.enterprise.fast.dto.response.PagedResponse;
import com.enterprise.fast.service.FastProblemService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.nio.charset.StandardCharsets;
import java.time.LocalDate;
import java.util.List;

@RestController
@RequestMapping("/api/v1/problems")
@RequiredArgsConstructor
@Tag(name = "FAST Problems", description = "Problem ticket CRUD operations")
public class FastProblemController {

    private final FastProblemService problemService;

    @PostMapping
    @Operation(summary = "Create a new FAST problem ticket")
    public ResponseEntity<FastProblemResponse> create(
            @Valid @RequestBody CreateFastProblemRequest request,
            Authentication authentication) {
        FastProblemResponse response = problemService.create(request, authentication.getName());
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    @GetMapping
    @Operation(summary = "List all problem tickets (paginated, with optional filters)")
    public ResponseEntity<PagedResponse<FastProblemResponse>> getAll(
            @RequestParam(required = false) String q,
            @RequestParam(required = false) String region,
            @RequestParam(required = false) String classification,
            @RequestParam(required = false) String application,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate fromDate,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate toDate,
            @RequestParam(required = false) String status,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size,
            @RequestParam(defaultValue = "createdDate") String sortBy,
            @RequestParam(defaultValue = "desc") String direction) {
        boolean hasFilters = (q != null && !q.isBlank()) || (region != null && !region.isBlank())
                || (classification != null && !classification.isBlank())
                || (application != null && !application.isBlank())
                || fromDate != null || toDate != null
                || (status != null && !status.isBlank());
        if (hasFilters) {
            return ResponseEntity.ok(problemService.findWithFilters(q, region, classification, application, fromDate, toDate, status, page, size, sortBy, direction));
        }
        return ResponseEntity.ok(problemService.getAll(page, size, sortBy, direction));
    }

    @GetMapping("/{id}")
    @Operation(summary = "Get problem ticket by ID")
    public ResponseEntity<FastProblemResponse> getById(@PathVariable Long id) {
        return ResponseEntity.ok(problemService.getById(id));
    }

    @PutMapping("/{id}")
    @Operation(summary = "Update a problem ticket")
    public ResponseEntity<FastProblemResponse> update(
            @PathVariable Long id,
            @RequestBody UpdateFastProblemRequest request,
            Authentication authentication) {
        return ResponseEntity.ok(problemService.update(id, request, authentication.getName()));
    }

    @PatchMapping("/{id}/status")
    @Operation(summary = "Update problem ticket status")
    public ResponseEntity<FastProblemResponse> updateStatus(
            @PathVariable Long id,
            @Valid @RequestBody StatusUpdateRequest request,
            Authentication authentication) {
        return ResponseEntity.ok(problemService.updateStatus(id, request.getStatus(), authentication.getName()));
    }

    @DeleteMapping("/{id}")
    @Operation(summary = "Soft delete a problem ticket (Admin only)")
    public ResponseEntity<Void> delete(@PathVariable Long id, Authentication authentication) {
        problemService.softDelete(id, authentication.getName());
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/region/{code}")
    @Operation(summary = "Get tickets by region")
    public ResponseEntity<PagedResponse<FastProblemResponse>> getByRegion(
            @PathVariable String code,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        return ResponseEntity.ok(problemService.getByRegion(code, page, size));
    }

    @GetMapping("/classification/{classification}")
    @Operation(summary = "Get tickets by classification (A/R/P)")
    public ResponseEntity<PagedResponse<FastProblemResponse>> getByClassification(
            @PathVariable String classification,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        return ResponseEntity.ok(problemService.getByClassification(classification, page, size));
    }

    @GetMapping("/status/{status}")
    @Operation(summary = "Get tickets by status")
    public ResponseEntity<PagedResponse<FastProblemResponse>> getByStatus(
            @PathVariable String status,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        return ResponseEntity.ok(problemService.getByStatus(status, page, size));
    }

    @GetMapping("/search")
    @Operation(summary = "Search tickets by keyword")
    public ResponseEntity<PagedResponse<FastProblemResponse>> search(
            @RequestParam String q,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        return ResponseEntity.ok(problemService.search(q, page, size));
    }

    @GetMapping("/export")
    @Operation(summary = "Export tickets as CSV")
    public ResponseEntity<byte[]> exportCsv(
            @RequestParam(required = false) String q,
            @RequestParam(required = false) String region,
            @RequestParam(required = false) String classification,
            @RequestParam(required = false) String application,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate fromDate,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate toDate,
            @RequestParam(required = false) String status,
            @RequestParam(defaultValue = "1000") int limit) {
        List<FastProblemResponse> data = problemService.exportWithFilters(q, region, classification, application, fromDate, toDate, status, limit);
        String csv = toCsv(data);
        byte[] utf8Bom = new byte[]{(byte) 0xEF, (byte) 0xBB, (byte) 0xBF};
        byte[] csvBytes = csv.getBytes(StandardCharsets.UTF_8);
        byte[] body = new byte[utf8Bom.length + csvBytes.length];
        System.arraycopy(utf8Bom, 0, body, 0, utf8Bom.length);
        System.arraycopy(csvBytes, 0, body, utf8Bom.length, csvBytes.length);
        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(new MediaType("text", "csv", StandardCharsets.UTF_8));
        headers.setContentDispositionFormData("attachment", "tickets.csv");
        return new ResponseEntity<>(body, headers, HttpStatus.OK);
    }

    private String toCsv(List<FastProblemResponse> data) {
        StringBuilder sb = new StringBuilder();
        sb.append("id,title,pbtId,incidentNumber,problemNumber,classification,region,status,userImpact,priority,confluenceLink,createdBy,createdDate\n");
        if (data == null) return sb.toString();
        for (FastProblemResponse r : data) {
            if (r == null) continue;
            sb.append(escapeCsv(r.getId())).append(",");
            sb.append(escapeCsv(r.getTitle())).append(",");
            sb.append(escapeCsv(r.getPbtId())).append(",");
            sb.append(escapeCsv(r.getServicenowIncidentNumber())).append(",");
            sb.append(escapeCsv(r.getServicenowProblemNumber())).append(",");
            sb.append(escapeCsv(r.getClassification())).append(",");
            sb.append(escapeCsv(r.getRegionalCode())).append(",");
            sb.append(escapeCsv(r.getStatus())).append(",");
            sb.append(r.getUserImpactCount() != null ? r.getUserImpactCount() : "").append(",");
            sb.append(r.getPriority() != null ? r.getPriority() : "").append(",");
            sb.append(escapeCsv(r.getConfluenceLink())).append(",");
            sb.append(escapeCsv(r.getCreatedBy())).append(",");
            sb.append(escapeCsv(r.getCreatedDate() != null ? r.getCreatedDate().toString() : "")).append("\n");
        }
        return sb.toString();
    }

    private String escapeCsv(Object value) {
        if (value == null) return "";
        String s = value.toString();
        if (s.contains(",") || s.contains("\"") || s.contains("\n")) {
            return "\"" + s.replace("\"", "\"\"") + "\"";
        }
        return s;
    }
}
