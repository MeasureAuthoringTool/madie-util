import React, { useEffect, useState } from "react";
import {
  Accordion,
  AccordionDetails,
  AccordionSummary,
  Box,
  Drawer,
  IconButton,
  Tooltip,
  Typography,
} from "@mui/material";
import { MessageSquare, X, ChevronRight } from "lucide-react";
import { Button, RichTextEditor } from "@madie/madie-design-system/dist/react";
import ReviewSubSection from "./general/ReviewSubSection";
import CommentSubSection from "./CommentSubSection";
import { ReviewEntityType } from "../../../util/reviewReadiness";
import "./CommentsFlyoutPanel.scss";

const GENERAL_SECTION = "General";

export interface CommentSection {
  name: string;
  subSections: string[];
}

export interface CommentSectionLocation {
  activeMainSection?: string;
  activeSubSection: string;
}

export interface CommentsFlyoutPanelProps {
  open: boolean;
  onClose: () => void;
  entityType: ReviewEntityType;
  sections: CommentSection[];
  activeSection: CommentSectionLocation;
  commentedSubSections?: string[];
  readyForReviewBy?: string;
  readyForReviewAt?: string;
}

const MAX_LABEL_LENGTH = 50;
const getAddCommentLabel = (subSection: string) => {
  const fullLabel = `Add a comment to ${subSection}`;
  const isLabelTruncated = fullLabel.length > MAX_LABEL_LENGTH;

  if (!isLabelTruncated) {
    return fullLabel;
  }

  const displayLabel = `${fullLabel.slice(0, MAX_LABEL_LENGTH)}...`;
  return (
    <Tooltip title={fullLabel} arrow>
      <span>{displayLabel}</span>
    </Tooltip>
  );
};

const subSectionKey = (section: string, subSection: string) =>
  `${section}::${subSection}`;

const CommentsFlyoutPanel = ({
  open,
  onClose,
  entityType,
  sections,
  activeSection,
  commentedSubSections = [],
  readyForReviewBy,
  readyForReviewAt,
}: CommentsFlyoutPanelProps) => {
  const { activeMainSection: mainSection, activeSubSection: subSection } =
    activeSection;
  const [comment, setComment] = useState("");
  const [expandedSections, setExpandedSections] = useState<string[]>([]);
  const [expandedSubSection, setExpandedSubSection] = useState<{
    section: string;
    key: string;
  }>(null);
  const [selectedSubSection, setSelectedSubSection] = useState<string>(null);
  const currentKey = mainSection
    ? subSectionKey(mainSection, subSection)
    : null;
  const hasComment =
    comment
      .replace(/<[^>]*>/g, "")
      .replace(/&nbsp;/g, " ")
      .trim().length > 0;

  useEffect(() => {
    setExpandedSections(mainSection ? [mainSection] : []);
    setExpandedSubSection(
      currentKey ? { section: mainSection, key: currentKey } : null
    );
    setSelectedSubSection(currentKey);
  }, [mainSection, subSection, open]);

  const toggleSection = (section: string, expanded: boolean) =>
    setExpandedSections((sections) =>
      expanded
        ? [...sections, section]
        : sections.filter((expandedSection) => expandedSection !== section)
    );

  const toggleSubSection = (
    section: string,
    key: string,
    expanded: boolean
  ) => {
    setSelectedSubSection(key);
    setExpandedSubSection(expanded ? { section, key } : null);
    if (expanded && expandedSubSection?.section !== section) {
      setExpandedSections((sections) => [
        ...sections.filter(
          (name) => name !== expandedSubSection?.section && name !== section
        ),
        section,
      ]);
    }
  };

  const handleClose = () => {
    setComment("");
    onClose();
  };

  return (
    <Drawer
      anchor="right"
      open={open}
      onClose={handleClose}
      data-testid="comments-flyout"
    >
      <Box
        role="dialog"
        aria-label="Comments"
        className="comments-flyout-panel"
      >
        <Box className="comments-flyout-panel-header">
          <Box className="comments-flyout-panel-title-row">
            <MessageSquare color="#0096f4" size={14} />
            <Typography variant="h6" className="comments-flyout-panel-title">
              Comments
            </Typography>
          </Box>
          <IconButton
            aria-label="Close comments"
            data-testid="comments-flyout-close"
            onClick={handleClose}
          >
            <X />
          </IconButton>
        </Box>

        <Box className="comments-flyout-panel-sections">
          <Accordion
            disableGutters
            elevation={0}
            expanded={expandedSections.includes(GENERAL_SECTION)}
            onChange={(event, expanded) =>
              toggleSection(GENERAL_SECTION, expanded)
            }
            className="comments-flyout-panel-accordion"
          >
            <AccordionSummary
              expandIcon={<ChevronRight />}
              className="comments-flyout-panel-accordion-summary"
            >
              <Typography className="comments-flyout-panel-section-title">
                {GENERAL_SECTION}
              </Typography>
            </AccordionSummary>
            <AccordionDetails className="comments-flyout-panel-section-details">
              <ReviewSubSection
                entityType={entityType}
                readyForReviewBy={readyForReviewBy}
                readyForReviewAt={readyForReviewAt}
                expanded={
                  expandedSubSection?.key ===
                  subSectionKey(GENERAL_SECTION, "Review")
                }
                highlighted={
                  selectedSubSection ===
                  subSectionKey(GENERAL_SECTION, "Review")
                }
                onToggle={(expanded) =>
                  toggleSubSection(
                    GENERAL_SECTION,
                    subSectionKey(GENERAL_SECTION, "Review"),
                    expanded
                  )
                }
              />
            </AccordionDetails>
          </Accordion>

          {sections.map((section) => {
            const isCurrentSection = section.name === mainSection;
            const subSections = section.subSections.filter(
              (name) =>
                commentedSubSections.includes(
                  subSectionKey(section.name, name)
                ) ||
                (isCurrentSection && name === subSection)
            );
            if (isCurrentSection && !subSections.includes(subSection)) {
              subSections.push(subSection);
            }

            return (
              <Accordion
                key={section.name}
                disableGutters
                elevation={0}
                expanded={expandedSections.includes(section.name)}
                onChange={(event, expanded) =>
                  toggleSection(section.name, expanded)
                }
                className="comments-flyout-panel-accordion"
              >
                <AccordionSummary
                  expandIcon={<ChevronRight />}
                  className="comments-flyout-panel-accordion-summary"
                >
                  <Typography className="comments-flyout-panel-section-title">
                    {section.name}
                  </Typography>
                </AccordionSummary>
                <AccordionDetails className="comments-flyout-panel-section-details">
                  {subSections.map((name) => {
                    const key = subSectionKey(section.name, name);

                    return (
                      <CommentSubSection
                        key={key}
                        title={name}
                        highlighted={selectedSubSection === key}
                        expanded={expandedSubSection?.key === key}
                        onToggle={(expanded) =>
                          toggleSubSection(section.name, key, expanded)
                        }
                        data-testid={
                          key === currentKey
                            ? "comments-current-subsection"
                            : undefined
                        }
                      />
                    );
                  })}
                </AccordionDetails>
              </Accordion>
            );
          })}
        </Box>

        <Box className="comments-flyout-panel-composer">
          <RichTextEditor
            id="comments-flyout-input"
            name="comments-flyout-input"
            data-testid="comments-flyout-input"
            label={getAddCommentLabel(subSection)}
            content={comment}
            onChange={(value: string) => setComment(value)}
          />
          <Box className="comments-flyout-panel-actions">
            <Button
              variant="outline-secondary"
              disabled={!hasComment}
              onClick={() => setComment("")}
              data-testid="comments-flyout-cancel"
            >
              Cancel
            </Button>
            <Button
              variant="outline-cyan"
              disabled={!hasComment}
              data-testid="comments-flyout-add"
            >
              Add Comment
            </Button>
          </Box>
        </Box>
      </Box>
    </Drawer>
  );
};

export default CommentsFlyoutPanel;
