package com.enterprise.fast.service;

import com.enterprise.fast.dto.response.FastProblemResponse;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class DailyReportTemplateService {

    /**
     * Builds the Daily Report HTML body (matches ticket email template style).
     * Used by the scheduler and by the preview endpoint.
     */
    public String buildHtml(String zoneName, String reportDate, List<FastProblemResponse> tickets) {
        StringBuilder rows = new StringBuilder();
        if (tickets.isEmpty()) {
            rows.append("<tr><td colspan=\"8\" style=\"padding:24px; text-align:center; font-size:13px; color:#64748b; border-bottom:1px solid #e2e8f0;\">No open tickets for this region.</td></tr>");
        }
        for (FastProblemResponse t : tickets) {
            if (t == null) continue;
            String status = t.getStatus() != null ? t.getStatus().replace("_", " ") : "—";
            String pbtId = escape(t.getPbtId() != null ? t.getPbtId() : "");
            if (pbtId.isEmpty()) pbtId = "—";
            String title = escape(t.getTitle());
            if (title.isEmpty()) title = "—";
            String assignee = escape(t.getAssignedTo() != null ? t.getAssignedTo() : "—");
            String priority = t.getPriority() != null && t.getPriority() >= 1 && t.getPriority() <= 5
                    ? t.getPriority() + "/5" : "—";
            String age = t.getTicketAgeDays() != null ? t.getTicketAgeDays() + "d" : "—";
            String rag = t.getRagStatus() != null ? t.getRagStatus() : "—";
            String app = escape(t.getAffectedApplication() != null ? t.getAffectedApplication() : "—");
            rows.append("<tr>")
                    .append("<td style=\"padding:10px 12px; border-bottom:1px solid #e2e8f0; font-family:monospace; font-size:12px; color:#0f172a;\">").append(pbtId).append("</td>")
                    .append("<td style=\"padding:10px 12px; border-bottom:1px solid #e2e8f0; font-size:13px; color:#334155;\">").append(title).append("</td>")
                    .append("<td style=\"padding:10px 12px; border-bottom:1px solid #e2e8f0; font-size:12px;\"><span style=\"padding:2px 8px; border-radius:6px; font-weight:500; background:rgba(13,148,136,0.15); color:#0d9488;\">").append(escape(status)).append("</span></td>")
                    .append("<td style=\"padding:10px 12px; border-bottom:1px solid #e2e8f0; font-size:12px; color:#475569;\">").append(assignee).append("</td>")
                    .append("<td style=\"padding:10px 12px; border-bottom:1px solid #e2e8f0; font-size:12px; color:#475569;\">").append(priority).append("</td>")
                    .append("<td style=\"padding:10px 12px; border-bottom:1px solid #e2e8f0; font-size:12px; color:#475569;\">").append(age).append("</td>")
                    .append("<td style=\"padding:10px 12px; border-bottom:1px solid #e2e8f0; font-size:11px; color:#64748b;\">").append(escape(rag)).append("</td>")
                    .append("<td style=\"padding:10px 12px; border-bottom:1px solid #e2e8f0; font-size:12px; color:#475569;\">").append(app).append("</td>")
                    .append("</tr>");
        }
        String tableBody = rows.toString();
        return "<!DOCTYPE html>\n"
                + "<html lang=\"en\">\n"
                + "<head><meta charset=\"utf-8\"><meta name=\"viewport\" content=\"width=device-width, initial-scale=1\"><title>FAST Daily Report – " + escape(zoneName) + "</title></head>\n"
                + "<body style=\"margin:0; padding:20px; font-family:-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; font-size:14px; line-height:1.5; color:#1e293b; background:#f1f5f9;\">\n"
                + "  <div style=\"max-width:820px; margin:0 auto;\">\n"
                + "    <div style=\"margin-bottom:20px; padding:20px; background:#fff; border-radius:12px; border:1px solid #e2e8f0; box-shadow:0 1px 3px rgba(0,0,0,0.06);\">\n"
                + "      <h1 style=\"margin:0; font-size:20px; font-weight:600; color:#0f172a;\">FAST Daily Report</h1>\n"
                + "      <p style=\"margin:8px 0 0; font-size:14px; color:#64748b;\">" + escape(zoneName) + " · " + escape(reportDate) + "</p>\n"
                + "    </div>\n"
                + "    <div style=\"margin-bottom:20px; padding:16px 20px; background:#f8fafc; border-radius:10px; border:1px solid #e2e8f0;\">\n"
                + "      <span style=\"font-weight:600; color:#0f172a;\">Open tickets: " + tickets.size() + "</span>\n"
                + "    </div>\n"
                + "    <div style=\"background:#fff; border-radius:12px; border:1px solid #e2e8f0; overflow:hidden; box-shadow:0 1px 3px rgba(0,0,0,0.06);\">\n"
                + "      <table role=\"presentation\" cellpadding=\"0\" cellspacing=\"0\" border=\"0\" style=\"width:100%; border-collapse:collapse;\">\n"
                + "        <thead>\n"
                + "          <tr style=\"background:#f8fafc;\">\n"
                + "            <th style=\"padding:10px 12px; text-align:left; font-size:11px; font-weight:600; color:#64748b; text-transform:uppercase; letter-spacing:0.05em; border-bottom:1px solid #e2e8f0;\">PBT ID</th>\n"
                + "            <th style=\"padding:10px 12px; text-align:left; font-size:11px; font-weight:600; color:#64748b; text-transform:uppercase; letter-spacing:0.05em; border-bottom:1px solid #e2e8f0;\">Title</th>\n"
                + "            <th style=\"padding:10px 12px; text-align:left; font-size:11px; font-weight:600; color:#64748b; text-transform:uppercase; letter-spacing:0.05em; border-bottom:1px solid #e2e8f0;\">Status</th>\n"
                + "            <th style=\"padding:10px 12px; text-align:left; font-size:11px; font-weight:600; color:#64748b; text-transform:uppercase; letter-spacing:0.05em; border-bottom:1px solid #e2e8f0;\">Assignee</th>\n"
                + "            <th style=\"padding:10px 12px; text-align:left; font-size:11px; font-weight:600; color:#64748b; text-transform:uppercase; letter-spacing:0.05em; border-bottom:1px solid #e2e8f0;\">Priority</th>\n"
                + "            <th style=\"padding:10px 12px; text-align:left; font-size:11px; font-weight:600; color:#64748b; text-transform:uppercase; letter-spacing:0.05em; border-bottom:1px solid #e2e8f0;\">Age</th>\n"
                + "            <th style=\"padding:10px 12px; text-align:left; font-size:11px; font-weight:600; color:#64748b; text-transform:uppercase; letter-spacing:0.05em; border-bottom:1px solid #e2e8f0;\">RAG</th>\n"
                + "            <th style=\"padding:10px 12px; text-align:left; font-size:11px; font-weight:600; color:#64748b; text-transform:uppercase; letter-spacing:0.05em; border-bottom:1px solid #e2e8f0;\">Application</th>\n"
                + "          </tr>\n"
                + "        </thead>\n"
                + "        <tbody>\n"
                + tableBody
                + "        </tbody>\n"
                + "      </table>\n"
                + "    </div>\n"
                + "    <p style=\"margin:20px 0 0; font-size:11px; color:#94a3b8;\">FAST Problem Ticket System</p>\n"
                + "  </div>\n"
                + "</body>\n"
                + "</html>";
    }

    private static String escape(String s) {
        if (s == null) return "";
        return s.replace("&", "&amp;").replace("<", "&lt;").replace(">", "&gt;").replace("\"", "&quot;");
    }
}
