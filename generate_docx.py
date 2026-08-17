import zipfile
import html
import os

class DocxBuilder:
    def __init__(self):
        self.paragraphs = []

    def escape(self, text):
        return html.escape(str(text))

    def add_title(self, title, subtitle=None, company=None, date=None, version=None):
        # Cover page title
        p_xml = f"""
        <w:p>
          <w:pPr>
            <w:jc w:val="center"/>
            <w:spacing w:before="3600" w:after="360"/>
          </w:pPr>
          <w:r>
            <w:rPr>
              <w:rFonts w:ascii="Inter" w:hAnsi="Inter" w:cs="Inter"/>
              <w:sz w:val="56"/>
              <w:szCs w:val="56"/>
              <w:bold/>
              <w:color w:val="0F5C56"/>
            </w:rPr>
            <w:t>{self.escape(title)}</w:t>
          </w:r>
        </w:p>
        """
        self.paragraphs.append(p_xml)

        if subtitle:
            sub_xml = f"""
            <w:p>
              <w:pPr>
                <w:jc w:val="center"/>
                <w:spacing w:after="2400"/>
              </w:pPr>
              <w:r>
                <w:rPr>
                  <w:rFonts w:ascii="Inter" w:hAnsi="Inter" w:cs="Inter"/>
                  <w:sz w:val="28"/>
                  <w:italic/>
                  <w:color w:val="5B655F"/>
                </w:rPr>
                <w:t>{self.escape(subtitle)}</w:t>
              </w:r>
            </w:p>
            """
            self.paragraphs.append(sub_xml)

        meta_lines = []
        if company:
            meta_lines.append((company, True, "1C2321"))
        if date:
            meta_lines.append((date, False, "5B655F"))
        if version:
            meta_lines.append((version, False, "8A938D"))

        for text, is_bold, color in meta_lines:
            bold_tag = "<w:bold/>" if is_bold else ""
            meta_xml = f"""
            <w:p>
              <w:pPr>
                <w:jc w:val="center"/>
                <w:spacing w:after="120"/>
              </w:pPr>
              <w:r>
                <w:rPr>
                  <w:rFonts w:ascii="Inter" w:hAnsi="Inter"/>
                  <w:sz w:val="22"/>
                  {bold_tag}
                  <w:color w:val="{color}"/>
                </w:rPr>
                <w:t>{self.escape(text)}</w:t>
              </w:r>
            </w:p>
            """
            self.paragraphs.append(meta_xml)

        self.add_page_break()

    def add_heading_1(self, text):
        h_xml = f"""
        <w:p>
          <w:pPr>
            <w:spacing w:before="480" w:after="240"/>
            <w:keepNext/>
          </w:pPr>
          <w:r>
            <w:rPr>
              <w:rFonts w:ascii="Inter" w:hAnsi="Inter"/>
              <w:sz w:val="36"/>
              <w:szCs w:val="36"/>
              <w:bold/>
              <w:color w:val="0F5C56"/>
            </w:rPr>
            <w:t>{self.escape(text)}</w:t>
          </w:r>
        </w:p>
        """
        self.paragraphs.append(h_xml)

    def add_heading_2(self, text):
        h_xml = f"""
        <w:p>
          <w:pPr>
            <w:spacing w:before="360" w:after="180"/>
            <w:keepNext/>
          </w:pPr>
          <w:r>
            <w:rPr>
              <w:rFonts w:ascii="Inter" w:hAnsi="Inter"/>
              <w:sz w:val="28"/>
              <w:szCs w:val="28"/>
              <w:bold/>
              <w:color w:val="4F46E5"/>
            </w:rPr>
            <w:t>{self.escape(text)}</w:t>
          </w:r>
        </w:p>
        """
        self.paragraphs.append(h_xml)

    def add_heading_3(self, text):
        h_xml = f"""
        <w:p>
          <w:pPr>
            <w:spacing w:before="240" w:after="120"/>
            <w:keepNext/>
          </w:pPr>
          <w:r>
            <w:rPr>
              <w:rFonts w:ascii="Inter" w:hAnsi="Inter"/>
              <w:sz w:val="24"/>
              <w:szCs w:val="24"/>
              <w:bold/>
              <w:color w:val="1C2321"/>
            </w:rPr>
            <w:t>{self.escape(text)}</w:t>
          </w:r>
        </w:p>
        """
        self.paragraphs.append(h_xml)

    def add_paragraph(self, text, is_italic=False, color="1C2321"):
        italic_tag = "<w:italic/>" if is_italic else ""
        p_xml = f"""
        <w:p>
          <w:pPr>
            <w:spacing w:after="180"/>
          </w:pPr>
          <w:r>
            <w:rPr>
              <w:rFonts w:ascii="Inter" w:hAnsi="Inter"/>
              <w:sz w:val="21"/>
              {italic_tag}
              <w:color w:val="{color}"/>
            </w:rPr>
            <w:t>{self.escape(text)}</w:t>
          </w:r>
        </w:p>
        """
        self.paragraphs.append(p_xml)

    def add_bullet(self, text):
        # We simulate bullet item using indentation
        b_xml = f"""
        <w:p>
          <w:pPr>
            <w:ind w:left="480" w:hanging="240"/>
            <w:spacing w:after="90"/>
          </w:pPr>
          <w:r>
            <w:rPr>
              <w:rFonts w:ascii="Inter" w:hAnsi="Inter"/>
              <w:sz w:val="21"/>
              <w:bold/>
              <w:color w:val="0F5C56"/>
            </w:rPr>
            <w:t>• </w:t>
          </w:r>
          <w:r>
            <w:rPr>
              <w:rFonts w:ascii="Inter" w:hAnsi="Inter"/>
              <w:sz w:val="21"/>
              <w:color w:val="1C2321"/>
            </w:rPr>
            <w:t>{self.escape(text)}</w:t>
          </w:r>
        </w:p>
        """
        self.paragraphs.append(b_xml)

    def add_page_break(self):
        pb_xml = """
        <w:p>
          <w:r>
            <w:br w:type="page"/>
          </w:r>
        </w:p>
        """
        self.paragraphs.append(pb_xml)

    def add_table(self, headers, rows):
        # Build table XML with modern styles: light borders, colored headers, padded cells
        tbl_xml = []
        tbl_xml.append("<w:tbl>")
        
        # Table properties
        tbl_xml.append("""
          <w:tblPr>
            <w:tblW w:w="5000" w:type="pct"/>
            <w:tblCellMar>
              <w:top w:w="120" w:type="dxa"/>
              <w:left w:w="180" w:type="dxa"/>
              <w:bottom w:w="120" w:type="dxa"/>
              <w:right w:w="180" w:type="dxa"/>
            </w:tblCellMar>
            <w:tblBorders>
              <w:top w:val="single" w:sz="6" w:space="0" w:color="CBD5E1"/>
              <w:left w:val="none"/>
              <w:bottom w:val="single" w:sz="12" w:space="0" w:color="0F5C56"/>
              <w:right w:val="none"/>
              <w:insideH w:val="single" w:sz="4" w:space="0" w:color="E2E8F0"/>
              <w:insideV w:val="none"/>
            </w:tblBorders>
          </w:tblPr>
        """)

        # Table Header Row
        tbl_xml.append("<w:tr>")
        for h in headers:
            tbl_xml.append(f"""
            <w:tc>
              <w:tcPr>
                <w:shd w:val="clear" w:color="auto" w:fill="E7F1EF"/>
              </w:tcPr>
              <w:p>
                <w:pPr>
                  <w:spacing w:after="0"/>
                </w:pPr>
                <w:r>
                  <w:rPr>
                    <w:rFonts w:ascii="Inter" w:hAnsi="Inter"/>
                    <w:sz w:val="20"/>
                    <w:bold/>
                    <w:color w:val="0F5C56"/>
                  </w:rPr>
                  <w:t>{self.escape(h)}</w:t>
                </w:r>
              </w:p>
            </w:tc>
            """)
        tbl_xml.append("</w:tr>")

        # Table Body Rows
        for row in rows:
            tbl_xml.append("<w:tr>")
            for cell in row:
                tbl_xml.append(f"""
                <w:tc>
                  <w:p>
                    <w:pPr>
                      <w:spacing w:after="0"/>
                    </w:pPr>
                    <w:r>
                      <w:rPr>
                        <w:rFonts w:ascii="Inter" w:hAnsi="Inter"/>
                        <w:sz w:val="19"/>
                        <w:color w:val="1C2321"/>
                      </w:rPr>
                      <w:t>{self.escape(cell)}</w:t>
                    </w:r>
                  </w:p>
                </w:tc>
                """)
            tbl_xml.append("</w:tr>")

        tbl_xml.append("</w:tbl>")
        self.paragraphs.append("\n".join(tbl_xml))
        
        # Add a spacing paragraph after the table
        self.add_paragraph("")

    def save(self, filepath):
        content_types = """<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">
  <Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>
  <Default Extension="xml" ContentType="application/xml"/>
  <Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/>
</Types>"""

        rels = """<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="word/document.xml"/>
</Relationships>"""

        document_body = "\n".join(self.paragraphs)
        document_xml = f"""<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">
  <w:body>
    {document_body}
    <w:sectPr>
      <w:pgSz w:w="12240" w:h="15840"/>
      <w:pgMar w:top="1440" w:right="1440" w:bottom="1440" w:left="1440" w:header="720" w:footer="720" w:gutter="0"/>
    </w:sectPr>
  </w:body>
</w:document>"""

        with zipfile.ZipFile(filepath, 'w', zipfile.ZIP_DEFLATED) as docx:
            docx.writestr('[Content_Types].xml', content_types)
            docx.writestr('_rels/.rels', rels)
            docx.writestr('word/document.xml', document_xml)

def generate_brd(path):
    doc = DocxBuilder()
    doc.add_title(
        title="Business Requirements Document (BRD)",
        subtitle="Amul Omnichannel Customer Service Console Project",
        company="Amul Omnichannel Solutions Ltd.",
        date="August 2026",
        version="v1.0.0"
    )

    doc.add_heading_1("1. Executive Summary")
    doc.add_heading_2("1.1 Project Background")
    doc.add_paragraph(
        "Amul operates a high-volume consumer relations network handling customer feedback, operational queries, and financial reconciliation (e.g. loan EMIs and credit queries). "
        "Historically, support agents managed interactions using disparate systems, leading to fragmented communication, extended resolution times, and poor tracking. "
        "The Amul Omnichannel Customer Service Console project consolidates all communication channels—web chat, email, click-to-call voice, and notifications—into a single web application. "
        "This console enables support staff to handle tickets, access customer profiles, and review loan stages from a unified console."
    )
    doc.add_heading_2("1.2 Problem Statement")
    doc.add_paragraph(
        "The existing workflow suffered from high Average Handle Time (AHT) and poor Service Level Agreement (SLA) tracking because agents had to manually match phone calls to chat history. "
        "Additionally, management lacked live dashboard views of agent utilization, status tracking, and queue performance. This system addresses those gaps."
    )
    
    doc.add_heading_1("2. Business Objectives & Success Metrics")
    doc.add_paragraph("The primary goals of implementing the consolidated platform are:")
    doc.add_bullet("Decrease overall Average Handle Time (AHT) by 20% within the first quarter of deployment.")
    doc.add_bullet("Establish a consistent SLA compliance rate of 95% or higher across all support tiers.")
    doc.add_bullet("Unify agent status states (Available, Break, Offline, Training) to optimize resource allocation.")
    doc.add_bullet("Enable direct download of audit trails, compliance reports, and requirement specifications for audit readiness.")
    doc.add_bullet("Improve Customer Satisfaction (CSAT) scores to a baseline of 4.5/5.0 and Net Promoter Score (NPS) to +50.")

    doc.add_heading_1("3. Stakeholders & User Personas")
    doc.add_paragraph("The platform accommodates three primary user groups, detailed below:")
    
    headers_stakeholders = ["Role / Persona", "Primary Responsibilities", "System Needs"]
    rows_stakeholders = [
        ["Frontline Support Agent", "Responds to chats/emails, makes verification calls, and updates ticket status.", "Real-time ticket updates, integrated loan info, click-to-call popup, email templates."],
        ["Customer Service Manager", "Monitors queue performance, audits agent logs, handles escalations, schedules leaves.", "Live analytics panel, team status grids, shift logs, leave management UI."],
        ["System Administrator", "Maintains system settings, manages templates, audits system logs.", "Access to compliance reporting, system preference configurations, and templates."]
    ]
    doc.add_table(headers_stakeholders, rows_stakeholders)

    doc.add_heading_1("4. Scope of the System")
    doc.add_heading_2("4.1 In-Scope Features")
    doc.add_bullet("Centralized chat and email communication feed (Omnichannel timeline).")
    doc.add_bullet("Interactive ticketing workspace with statuses: New, Open, Pending, Escalated, Merged, and Closed.")
    doc.add_bullet("Agent status control (Available, Break, Training, Meeting, Offline) with live duration logs.")
    doc.add_bullet("Analytics panel showing 7-day trends, priority distribution, AHT metrics, and channel-wise traffic.")
    doc.add_bullet("Dynamic customer database showing historical interactions, credit status, and active loan phases.")
    doc.add_bullet("Support management utilities including bulk action panels and ticket merge interfaces.")
    
    doc.add_heading_2("4.2 Out-of-Scope Features")
    doc.add_bullet("Automatic credit disbursement: System displays loan stages but does not approve or disburse funds.")
    doc.add_bullet("VoIP carrier hardware: Integration is mock-based; physical SIP trunking configuration is out-of-scope.")
    doc.add_bullet("External social media feeds (planned for Phase 2).")

    doc.add_heading_1("5. Business Rules & Compliance")
    doc.add_heading_2("5.1 SLA Window Rules")
    doc.add_paragraph("Ticket resolution times are strictly bound to priority levels as outlined below:")
    
    headers_sla = ["Ticket Priority", "First Response SLA", "Resolution SLA", "Escalation Path"]
    rows_sla = [
        ["Critical", "15 Minutes", "4 Hours", "Auto-escalate to Manager on SLA breach"],
        ["High", "1 Hour", "12 Hours", "Flag as breached, notify Supervisor"],
        ["Medium", "4 Hours", "24 Hours", "Flag as warning, queue prioritization"],
        ["Low", "8 Hours", "48 Hours", "Standard queue assignment"]
    ]
    doc.add_table(headers_sla, rows_sla)
    
    doc.add_heading_2("5.2 Compliance & Safety")
    doc.add_bullet("Regulatory Logging: All agent status changes and ticket reassignments must be logged for RBI auditing.")
    doc.add_bullet("Account Data Masking: Phone numbers and loan IDs must be partially masked for unauthorized roles.")

    doc.save(path)
    print(f"BRD generated successfully at {path}")

def generate_frd(path):
    doc = DocxBuilder()
    doc.add_title(
        title="Functional Requirements Document (FRD)",
        subtitle="Amul Omnichannel Customer Service Console Technical Specs",
        company="Amul Omnichannel Solutions Ltd.",
        date="August 2026",
        version="v1.0.0"
    )

    doc.add_heading_1("1. System Functional Architecture")
    doc.add_paragraph(
        "The Amul Omnichannel Console is structured as a client-side single-page application (SPA). It maintains "
        "application state in memory and uses modular CSS styles combined with event-driven Javascript logic. "
        "The application layout is divided into a top bar header, a left navigation rail, and a main content workspace."
    )
    
    doc.add_heading_1("2. User Interface Specifications")
    doc.add_heading_2("2.1 Navigation & Rail Layout")
    doc.add_paragraph("The navigation rail provides access to primary application workspaces:")
    doc.add_bullet("Home / Dashboard: Displays the overall manager analytics and operational charts.")
    doc.add_bullet("Chatbox Console: The primary workspace for ticket routing, message composition, and client details.")
    doc.add_bullet("Agents & Teams: Shows live activity states and agent status logs.")
    doc.add_bullet("Reports & Documents: Houses system document downloads, including BRD, FRD, and data logs.")
    doc.add_bullet("System Settings: Exposes general configuration options and platform rules.")

    doc.add_heading_2("2.2 Ticket Details Console")
    doc.add_paragraph(
        "The main console is a three-pane layout: a left sidebar for ticket filtering and selection, "
        "a middle timeline feed for historical agent/customer communications (chat, email, and mock calls), "
        "and a right sidebar showcasing client-specific context like active EMIs and survey feedback."
    )

    doc.add_heading_1("3. Functional Use Cases & Workflows")
    doc.add_heading_2("3.1 Ticket Lifecycle Management")
    doc.add_paragraph("The platform supports programmatic ticket creation, assignment, merging, and escalation:")
    
    headers_usecases = ["Function", "Trigger", "Inputs Required", "System Action"]
    rows_usecases = [
        ["Create Ticket", "Manual button click / inbound email", "Customer name, Phone, Priority, Category", "Validates input, assigns ID, pushes to the matching queue, fires toast alert."],
        ["Merge Tickets", "Click 'Merge' in bulk panel", "Primary Ticket ID, Secondary Ticket ID", "Links messages of secondary ticket to primary, updates status to closed-merged, writes log."],
        ["Escalate Ticket", "Click 'Escalate' in details pane", "Escalation reason", "Changes priority to Critical, logs action, flags item in Manager's review panel."]
    ]
    doc.add_table(headers_usecases, rows_usecases)

    doc.add_heading_2("3.2 Agent State Control")
    doc.add_paragraph(
        "Agents toggle their current status in the header. If the status is offline (Break, Training, Offline), the "
        "system automatically holds incoming routing. An activity tracker logs each status change with millisecond-precision."
    )

    doc.add_heading_1("4. System Data Model & Objects")
    doc.add_paragraph("The internal memory and store models map the following schemas:")

    doc.add_heading_2("4.1 Agent Schema")
    headers_agent = ["Field Name", "Data Type", "Constraints / Description"]
    rows_agent = [
        ["id", "String (PK)", "Unique alphanumeric agent code (e.g. 'a1')"],
        ["name", "String", "Full display name of the agent"],
        ["status", "Enum", "One of: Available, Break, Meeting, Training, Offline"],
        ["sla", "Numeric (Percent)", "Percentage of tickets resolved within SLA limit"],
        ["csat", "Numeric (Float)", "CSAT score average out of 5.0"]
    ]
    doc.add_table(headers_agent, rows_agent)

    doc.add_heading_2("4.2 Ticket Schema")
    headers_ticket = ["Field Name", "Data Type", "Constraints / Description"]
    rows_ticket = [
        ["id", "String (PK)", "Unique ticket identifier (e.g. 'TCK-10254')"],
        ["status", "Enum", "One of: Open, Escalated, Pending, Closed"],
        ["priority", "Enum", "One of: Critical, High, Medium, Low"],
        ["customerName", "String", "Name of the client linked to the ticket"],
        ["assignee", "String", "Agent assigned to this ticket"]
    ]
    doc.add_table(headers_ticket, rows_ticket)

    doc.add_heading_1("5. Non-Functional Specifications")
    doc.add_heading_2("5.1 Performance & Latency")
    doc.add_bullet("Dashboard metrics and SLA countdowns must refresh asynchronously without page reloads.")
    doc.add_bullet("Search and filter indexing on customer databases must return matches in under 200ms locally.")
    
    doc.add_heading_2("5.2 Local Security & File Generation")
    doc.add_bullet("Offline Accessibility: Key documents like the BRD and FRD must be compiled locally and stored in standard Office OpenXML (.docx) zip formats to avoid external document service calls, satisfying regulatory off-network policies.")

    doc.save(path)
    print(f"FRD generated successfully at {path}")

if __name__ == "__main__":
    generate_brd("BRD.docx")
    generate_frd("FRD.docx")
