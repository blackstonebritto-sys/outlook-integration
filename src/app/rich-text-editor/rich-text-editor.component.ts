// rich-text-editor.component.ts - Updated for Angular 20.3.0
import { Component, ElementRef, EventEmitter, forwardRef, HostListener, Input, NgZone, OnInit, Output, ViewChild, ViewEncapsulation, ChangeDetectorRef } from '@angular/core';
import { ControlValueAccessor, NG_VALUE_ACCESSOR, FormsModule } from '@angular/forms';
import { DomSanitizer } from '@angular/platform-browser';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-rich-editor',
  templateUrl: './rich-text-editor.component.html',
  styleUrls: ['./rich-text-editor.component.css'],
  standalone: true,
  imports: [CommonModule, FormsModule],
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => RichEditorComponent),
      multi: true,
    },
  ],
  encapsulation: ViewEncapsulation.None,
})
export class RichEditorComponent implements OnInit, ControlValueAccessor {
  @ViewChild('editor', { static: false }) editorRef!: ElementRef<HTMLElement>;
  @Input() placeholder = 'Write something...';
  @Output() htmlChange = new EventEmitter<string>();

  html = '';
  showSource = false;
  tableDialogOpen = false;
  tableRows = 2;
  tableCols = 2;
  tableBorderColor: string = '#000000';
  cellBackgroundColor: string = '#ffffff';

  // Undo/Redo functionality
  history: string[] = [];
  historyIndex = -1;
  private maxHistorySize = 50;

  onChange = (value: any) => { };
  onTouched = () => { };

  // Table cell tooltip
  tooltipVisible = false;
  tooltipX = 0;
  tooltipY = 0;
  selectedCell: HTMLElement | null = null;

  // Active states for toolbar buttons
  activeStates = {
    bold: false,
    italic: false,
    underline: false,
    strikeThrough: false,
    insertUnorderedList: false,
    insertOrderedList: false,
    justifyLeft: false,
    justifyCenter: false,
    justifyRight: false,
    justifyFull: false,
    formatBlock: 'P',
    fontName: '',
    fontSize: '',
    foreColor: '#000000'
  };

  fonts = [
    { label: 'Arial', value: 'Arial, sans-serif' },
    { label: 'Times New Roman', value: "Times New Roman, Times, serif" },
    { label: 'Courier New', value: "Courier New, Courier, monospace" },
    { label: 'Georgia', value: 'Georgia, serif' },
    { label: 'Verdana', value: 'Verdana, Geneva, sans-serif' },
    { label: 'Trebuchet MS', value: "Trebuchet MS, sans-serif" },
    { label: 'Comic Sans MS', value: "Comic Sans MS, cursive" } 
  ];

  constructor(private sanitizer: DomSanitizer, private ngZone: NgZone, private cdr: ChangeDetectorRef) { 
    console.log('=== RichEditorComponent constructor called ===');
  }

  ngOnInit() { 
    console.log('=== RichEditorComponent ngOnInit called ===');
  }

  writeValue(obj: any): void {
    this.html = obj || '';
    this.updateEditorFromHtml();
    this.initializeHistory();
  }

  registerOnChange(fn: any): void { this.onChange = fn; }
  registerOnTouched(fn: any): void { this.onTouched = fn; }

  onInput() {
    console.log('onInput called');
    if (this.editorRef) {
      const newHtml = this.editorRef.nativeElement.innerHTML || '';
      if (newHtml !== this.html) {
        this.addToHistory(newHtml);
        this.html = newHtml;
        this.onChange(this.html);
        this.htmlChange.emit(this.html);
        console.log('HTML updated:', this.html);
      }
      this.updateActiveStates();
    }
  }

  onSourceChange(val: string) {
    this.html = val;
    this.addToHistory(val);
    this.updateEditorFromHtml();
    this.onChange(this.html);
    this.htmlChange.emit(this.html);
  }

  updateEditorFromHtml() {
    if (this.editorRef) {
      setTimeout(() => {
        this.editorRef.nativeElement.innerHTML = this.html || '';
        this.updateActiveStates();
      }, 0);
    }
  }

  // Undo/Redo functionality
  private initializeHistory() {
    this.history = [this.html];
    this.historyIndex = 0;
  }

  private addToHistory(html: string) {
    // Don't add if it's the same as the current state
    if (this.history[this.historyIndex] === html) {
      return;
    }

    // Remove future history if we're not at the end
    if (this.historyIndex < this.history.length - 1) {
      this.history = this.history.slice(0, this.historyIndex + 1);
    }

    // Add new state
    this.history.push(html);
    this.historyIndex++;

    // Limit history size
    if (this.history.length > this.maxHistorySize) {
      this.history.shift();
      this.historyIndex--;
    }
  }

  undo() {
    if (this.historyIndex > 0) {
      this.historyIndex--;
      this.html = this.history[this.historyIndex];
      this.updateEditorFromHtml();
      this.onChange(this.html);
      this.htmlChange.emit(this.html);
    }
  }

  redo() {
    if (this.historyIndex < this.history.length - 1) {
      this.historyIndex++;
      this.html = this.history[this.historyIndex];
      this.updateEditorFromHtml();
      this.onChange(this.html);
      this.htmlChange.emit(this.html);
    }
  }

  // Keyboard shortcut handler
  onKeyDown(event: KeyboardEvent) {
    // Ctrl+Z for undo
    if (event.ctrlKey && event.key === 'z') {
      event.preventDefault();
      this.undo();
      return;
    }

    // Ctrl+Y or Ctrl+Shift+Z for redo
    if ((event.ctrlKey && event.key === 'y') || (event.ctrlKey && event.shiftKey && event.key === 'Z')) {
      event.preventDefault();
      this.redo();
      return;
    }

    // Ctrl+R for redo (additional shortcut)
    if (event.ctrlKey && event.key === 'r') {
      event.preventDefault();
      this.redo();
      return;
    }

    this.onTableKeyDown(event);
  }

  exec(cmd: string, value: any = null) {
    document.execCommand(cmd, false, value);
    // Force focus back to editor after command execution
    if (this.editorRef) {
      this.editorRef.nativeElement.focus();
    }
    this.onInput();
    this.updateActiveStates();
  }

  formatBlock(element: any) {
    const value = element.value;
    this.exec('formatBlock', `<${value.toLowerCase()}>`);
  }

  // Font family functionality
  // in your component.ts
  setFontFamily(fontFamily: string) {
    if (fontFamily) {
      this.exec('fontName', fontFamily);
    } else {
      // reset to default font
      this.exec('fontName', '');
    }
    // update model so select stays in sync
    this.activeStates.fontName = fontFamily;
  }


  // Font size functionality
  setFontSize(size: string) {
    if (size) {
      this.exec('fontSize', size);
    }
  }

  // Helper method for font size change event
  onFontSizeChange(event: Event) {
    const target = event.target as HTMLSelectElement;
    this.setFontSize(target?.value || '');
  }

  // Helper method for text color change event
  onTextColorChange(event: Event) {
    const target = event.target as HTMLInputElement;
    this.setTextColor(target);
  }

  // Helper method for cell color change event
  onCellColorChange(event: Event) {
    const target = event.target as HTMLInputElement;
    this.setCellColor(target);
  }

  createLink(url: string) {
    if (!url) return;
    if (!/^https?:\/\//i.test(url)) url = 'http://' + url;
    this.exec('createLink', url);
  }

  insertTableDialog() {
    this.tableDialogOpen = true;
    // Reset to default values
    this.tableRows = 2;
    this.tableCols = 2;
    this.tableBorderColor = '#000000';
    this.cellBackgroundColor = '#ffffff';
  }

  // Test method for debugging
  testAddRow() {
    console.log('=== TEST BUTTON CLICKED ===');
    console.log('Current selectedCell:', this.selectedCell);
    console.log('Current tooltipVisible:', this.tooltipVisible);
    alert('Test button clicked! Check console for logs.');
    
    // Try to find any table cell in the editor
    const table = this.editorRef.nativeElement.querySelector('table');
    if (table) {
      const firstCell = table.querySelector('td, th');
      if (firstCell) {
        this.selectedCell = firstCell as HTMLElement;
        console.log('Set selectedCell to first cell:', this.selectedCell);
        this.addRow('below');
      } else {
        console.log('No cells found in table');
      }
    } else {
      console.log('No table found in editor');
    }
  }

  // Test method for tooltip functionality
  testTooltipButton() {
    console.log('=== TOOLTIP BUTTON CLICKED ===');
    alert('Tooltip button clicked!');
  }

  // Simple test method
  testTooltipFunction() {
    console.log('Tooltip function called');
    this.ngZone.run(() => {
      alert('Tooltip function works!');
      this.cdr.detectChanges();
    });
  }

  // Simple test method
  simpleTest() {
    console.log('=== SIMPLE TEST CALLED ===');
    alert('Simple test method called!');
  }

  // Test method that should definitely work
  testMethod() {
    console.log('TEST METHOD CALLED');
    alert('TEST METHOD CALLED');
    return 'TEST METHOD CALLED';
  }

  // Force show tooltip for testing
  forceShowTooltip() {
    console.log('=== FORCE SHOW TOOLTIP ===');
    alert('FORCE SHOW TOOLTIP CALLED!');
    this.tooltipX = 200;
    this.tooltipY = 200;
    this.tooltipVisible = true;
    console.log('Tooltip forced to show at position:', this.tooltipX, this.tooltipY);
    
    // Also try to find a cell to select
    const table = this.editorRef.nativeElement.querySelector('table');
    if (table) {
      const firstCell = table.querySelector('td, th');
      if (firstCell) {
        this.selectedCell = firstCell as HTMLElement;
        console.log('Also set selectedCell to first cell:', this.selectedCell);
      }
    }
  }

  // Validate table inputs to ensure they're between 1-9
  validateTableInputs() {
    this.tableRows = Math.max(1, Math.min(9, this.tableRows));
    this.tableCols = Math.max(1, Math.min(9, this.tableCols));
  }

  // Prevent typing invalid values in table inputs
  preventInvalidTableInput(event: KeyboardEvent) {
    const input = event.target as HTMLInputElement;
    const key = event.key;

    // Allow only numbers and control keys
    if (!/^[0-9]$/.test(key) &&
      !['Backspace', 'Delete', 'ArrowLeft', 'ArrowRight', 'Tab'].includes(key)) {
      event.preventDefault();
      return;
    }

    // If a number is typed, check if it would exceed the max
    if (/^[0-9]$/.test(key)) {
      const newValue = input.value + key;
      if (parseInt(newValue) > 9) {
        event.preventDefault();
        input.value = '9';
        this.validateTableInputs();
      }
    }
  }

  // Update table preview when inputs change
  updateTablePreview() {
    // This method is called automatically when table inputs change
    // The preview updates automatically through Angular's data binding
  }

  insertTable(rows: number, cols: number) {
    // Validate rows and columns (1-9)
    rows = Math.max(1, Math.min(9, rows));
    cols = Math.max(1, Math.min(9, cols));

    const borderColor = this.tableBorderColor;
    const cellBgColor = this.cellBackgroundColor;

    let html = `<table style="width: 100%; border-spacing:0; border: 1px solid ${borderColor};">`;

    // Header row
    html += '<thead><tr>';
    for (let c = 0; c < cols; c++) {
      html += `<th style="padding:6px; border:1px solid ${borderColor}; background:${cellBgColor};">Header ${c + 1}</th>`;
    }
    html += '</tr></thead>';

    // Body rows
    html += '<tbody>';
    for (let r = 1; r < rows; r++) {
      html += '<tr>';
      for (let c = 0; c < cols; c++) {
        html += `<td style="padding:6px; border:1px solid ${borderColor}; background:${cellBgColor};">&nbsp;</td>`;
      }
      html += '</tr>';
    }
    html += '</tbody></table><p></p>';

    // Insert at cursor position or at the end if no selection
    this.insertHtmlAtCursorOrEnd(html);
    this.tableDialogOpen = false;
  }

  private insertHtmlAtCursorOrEnd(html: string) {
    const selection = window.getSelection();

    if (selection && selection.rangeCount > 0) {
      try {
        const range = selection.getRangeAt(0);
        // Check if selection is within the editor
        if (this.editorRef.nativeElement.contains(range.commonAncestorContainer)) {
          this.exec('insertHTML', html);
          return;
        }
      } catch (error) {
        console.warn('Error inserting at cursor, inserting at end:', error);
      }
    }

    // If no valid selection, insert at the end
    this.editorRef.nativeElement.innerHTML += html;
    this.onInput();
  }

  setTextColor(color: any) {
    this.exec('foreColor', color.value);
  }

  setCellColor(color: any) {
    const selection = window.getSelection();
    if (!selection || !selection.rangeCount) {
      this.showSelectionError();
      return;
    }

    try {
      const range = selection.getRangeAt(0);
      const cell = this.findParentCell(range.commonAncestorContainer);

      if (cell) {
        (cell as HTMLElement).style.backgroundColor = color.value;
        this.onInput();
      } else {
        this.showSelectionError();
      }
    } catch (error) {
      console.error('Error setting cell color:', error);
      this.showSelectionError();
    }
  }

  private findParentCell(element: any): HTMLElement | null {
    let current = element;
    while (current && current !== this.editorRef.nativeElement) {
      if (current.tagName && (current.tagName.toLowerCase() === 'td' || current.tagName.toLowerCase() === 'th')) {
        return current;
      }
      current = current.parentNode;
    }
    return null;
  }

  private showSelectionError() {
    // You can replace this with a proper toast/notification system
    alert('Please select a table cell first');
  }

  toggleSource() {
    this.showSource = !this.showSource;
    if (!this.showSource) {
      this.updateEditorFromHtml();
    }
  }

  onPaste(event: ClipboardEvent) {
    event.preventDefault();
    const clipboardData = event.clipboardData || (window as any).clipboardData;
    
    // Try to get HTML content first (for rich content from Word, etc.)
    let htmlContent = clipboardData.getData('text/html');
    
    if (htmlContent) {
      // Clean and sanitize the HTML content
      htmlContent = this.sanitizeHtml(htmlContent);
      this.exec('insertHTML', htmlContent);
    } else {
      // Fallback to plain text if no HTML content
      const text = clipboardData.getData('text');
      this.exec('insertHTML', this.textToHtmlSimple(text));
    }
  }

  clear() {
    if (this.editorRef) {
      this.editorRef.nativeElement.innerHTML = '';
      this.onInput();
    }
  }

  convertHtmlToText() {
    const div = document.createElement('div');
    div.innerHTML = this.html || this.editorRef.nativeElement.innerHTML || '';
    const text = div.innerText || '';
    this.html = this.escapeHtml(text.replace(/\n{3,}/g, '\n\n'));
    this.showSource = true;
  }

  convertTextToHtml() {
    const raw = this.showSource ? this.html : (this.editorRef.nativeElement.innerText || '');
    this.html = this.textToHtmlSimple(this.unescapeHtml(raw));
    this.updateEditorFromHtml();
    this.showSource = false;
    this.onChange(this.html);
    this.htmlChange.emit(this.html);
  }

  textToHtmlSimple(text: string) {
    if (!text) return '';
    return text.split(/\n\n+/).map(p => `<p>${this.escapeHtml(p.replace(/\n/g, '<br/>'))}</p>`).join('').replace(/&lt;br\/?&gt;/g, '<br/>');
  }

  escapeHtml(unsafe: string) {
    return unsafe.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/\"/g, '&quot;').replace(/'/g, '&#039;');
  }

  unescapeHtml(safe: string) {
    return safe.replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '\"').replace(/&#039;/g, "'");
  }

  sanitizeHtml(html: string): string {
    if (!html) return '';
    
    // Create a temporary div to parse the HTML
    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = html;
    
    // Remove Word-specific elements using proper DOM traversal
    this.removeWordElements(tempDiv);
    
    // Clean up Word-specific styles and attributes
    const allElements = tempDiv.querySelectorAll('*');
    allElements.forEach(el => {
      // Remove Word-specific attributes
      const attributes = Array.from(el.attributes);
      attributes.forEach(attr => {
        if (attr.name.startsWith('mso-') || 
            attr.name.startsWith('w:') || 
            attr.name.startsWith('v:') ||
            (attr.name === 'class' && attr.value.includes('Mso'))) {
          el.removeAttribute(attr.name);
        }
      });
      
      // Clean up inline styles
      if (el.hasAttribute('style')) {
        let style = el.getAttribute('style') || '';
        // Remove Word-specific CSS properties
        style = style.replace(/mso-[^;]+;?/gi, '');
        style = style.replace(/tab-stops:[^;]+;?/gi, '');
        style = style.replace(/text-indent:[^;]+;?/gi, '');
        style = style.replace(/mso-[^:]+:[^;]+;?/gi, '');
        
        if (style.trim()) {
          el.setAttribute('style', style);
        } else {
          el.removeAttribute('style');
        }
      }
    });
    
    // Get the cleaned HTML
    let cleanedHtml = tempDiv.innerHTML;
    
    // Additional cleanup for common Word artifacts using regex
    cleanedHtml = cleanedHtml.replace(/<o:p\s*\/?>/gi, '');
    cleanedHtml = cleanedHtml.replace(/<w:[^>]*>/gi, '');
    cleanedHtml = cleanedHtml.replace(/<\/w:[^>]*>/gi, '');
    cleanedHtml = cleanedHtml.replace(/<v:[^>]*>/gi, '');
    cleanedHtml = cleanedHtml.replace(/<\/v:[^>]*>/gi, '');
    cleanedHtml = cleanedHtml.replace(/<mso:[^>]*>/gi, '');
    cleanedHtml = cleanedHtml.replace(/<\/mso:[^>]*>/gi, '');
    
    // Clean up empty paragraphs and spans
    cleanedHtml = cleanedHtml.replace(/<p[^>]*>\s*<\/p>/gi, '');
    cleanedHtml = cleanedHtml.replace(/<span[^>]*>\s*<\/span>/gi, '');
    
    return cleanedHtml;
  }

  private removeWordElements(element: Element): void {
    // Get all child elements
    const children = Array.from(element.children);
    
    children.forEach(child => {
      const tagName = child.tagName.toLowerCase();
      
      // Remove Word-specific elements
      if (tagName === 'o:p' || 
          tagName.startsWith('mso-') || 
          tagName.startsWith('w:') || 
          tagName.startsWith('v:')) {
        // Move all child nodes to parent before removing
        while (child.firstChild) {
          element.insertBefore(child.firstChild, child);
        }
        element.removeChild(child);
      } else {
        // Recursively process child elements
        this.removeWordElements(child);
      }
    });
  }

  downloadHtml() {
    const content = `<!doctype html><html><head><meta charset=\"utf-8\"></head><body>${this.html}</body></html>`;
    const blob = new Blob([content], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'document.html';
    a.click();
    URL.revokeObjectURL(url);
  }

  // Show tooltip near cell
  showCellTooltip(event: MouseEvent) {
    console.log('showCellTooltip called, event.target:', event.target);
    const target = event.target as HTMLElement;
    console.log('target tagName:', target ? target.tagName : 'null');
    
    // Check if the target is a table cell or if we need to find the parent cell
    let cell: HTMLElement | null = null;
    
    if (target && (target.tagName === 'TD' || target.tagName === 'TH')) {
      cell = target;
      console.log('Direct cell click detected');
    } else if (target) {
      // Look for parent cell if the target is inside a cell (like text content)
      cell = target.closest('td, th') as HTMLElement;
      console.log('Parent cell search result:', cell);
    }
    
    if (cell) {
      this.selectedCell = cell;
      const rect = cell.getBoundingClientRect();
      
      // Position tooltip using fixed positioning (relative to viewport)
      this.tooltipX = rect.left + window.scrollX;
      this.tooltipY = rect.bottom + window.scrollY + 10; // 10px offset below cell
      this.tooltipVisible = true;
      
      console.log('Tooltip shown, selectedCell:', this.selectedCell, 'tooltipVisible:', this.tooltipVisible, 'position:', this.tooltipX, this.tooltipY);
    } else {
      console.log('No cell found, hiding tooltip');
      this.hideCellTooltip();
    }
  }

  hideCellTooltip() {
    this.tooltipVisible = false;
    this.selectedCell = null;
  }

  // Add a row above or below the selected cell
  addRow(position: 'above' | 'below') {
    console.log('=== addRow called ===');
    console.log('Position:', position);
    console.log('SelectedCell:', this.selectedCell);
    console.log('TooltipVisible:', this.tooltipVisible);
    
    if (!this.selectedCell) {
      console.log('No selectedCell, returning early');
      return;
    }
    
    this.ngZone.run(() => {
      try {
        // Store the selected cell before hiding tooltip
        const selectedCell = this.selectedCell;
        this.hideCellTooltip();
        
        const row = selectedCell?.parentElement as HTMLTableRowElement;
        if (!row) {
          console.error('Could not find parent row');
          return;
        }
        
        const table = row.closest('table');
        if (!table) {
          console.error('Could not find parent table');
          return;
        }
        
        // Create a new row with the same number of cells
        const newRow = document.createElement('tr');
        const cellCount = row.cells.length;
        
        for (let i = 0; i < cellCount; i++) {
          const originalCell = row.cells[i];
          const newCell = document.createElement(originalCell.tagName.toLowerCase() as 'td' | 'th');
          
          // Copy cell attributes
          Array.from(originalCell.attributes).forEach(attr => {
            newCell.setAttribute(attr.name, attr.value);
          });
          
          // Set empty content
          newCell.innerHTML = '&nbsp;';
          newRow.appendChild(newCell);
        }
        
        // Insert the new row
        if (position === 'above') {
          row.parentElement!.insertBefore(newRow, row);
        } else {
          row.parentElement!.insertBefore(newRow, row.nextSibling);
        }
        
        console.log('Row added successfully');
        this.onInput(); // This should trigger change detection
        this.cdr.detectChanges(); // Force change detection
      } catch (error) {
        console.error('Error adding row:', error);
      }
    });
  }

  // Add a column left or right of selected cell
  addColumn(position: 'left' | 'right') {
    console.log('addColumn called with position:', position, 'selectedCell:', this.selectedCell);
    if (!this.selectedCell) {
      console.log('No selectedCell, returning early');
      return;
    }
    
    this.ngZone.run(() => {
      try {
        // Store the selected cell before hiding tooltip
        const selectedCell = this.selectedCell;
        this.hideCellTooltip();
        
        const table = selectedCell?.closest('table');
        if (!table) {
          console.error('Could not find parent table');
          return;
        }
        
        const cellIndex = (selectedCell as HTMLTableCellElement).cellIndex;
        const targetIndex = position === 'left' ? cellIndex : cellIndex + 1;
        
        // Process all rows in the table
        const rows = table.querySelectorAll('tr');
        rows.forEach((tr, rowIndex) => {
          const referenceCell = tr.cells[cellIndex] || tr.cells[tr.cells.length - 1];
          const cellTagName = referenceCell ? referenceCell.tagName.toLowerCase() : 'td';
          const newCell = document.createElement(cellTagName as 'td' | 'th');
          if (referenceCell) {
            Array.from(referenceCell.attributes).forEach(attr => {
              newCell.setAttribute(attr.name, attr.value);
            });
          }
          
          // Set empty content
          newCell.innerHTML = '&nbsp;';
          
          // Insert the new cell
          if (targetIndex >= tr.cells.length) {
            tr.appendChild(newCell);
          } else {
            tr.insertBefore(newCell, tr.cells[targetIndex]);
          }
        });
        
        console.log('Column added successfully');
        this.onInput();
        this.cdr.detectChanges(); // Force change detection
      } catch (error) {
        console.error('Error adding column:', error);
      }
    });
  }

  // Delete row
  deleteRow() {
    console.log('deleteRow called, selectedCell:', this.selectedCell);
    if (!this.selectedCell) {
      console.log('No selectedCell, returning early');
      return;
    }
    
    this.ngZone.run(() => {
      try {
        // Store the selected cell before hiding tooltip
        const selectedCell = this.selectedCell;
        this.hideCellTooltip();
        
        const row = selectedCell?.parentElement as HTMLTableRowElement;
        if (!row) {
          console.error('Could not find parent row');
          return;
        }
        
        const table = row.closest('table');
        if (!table) {
          console.error('Could not find parent table');
          return;
        }
        
        // Check if this is the only row in the table
        const allRows = table.querySelectorAll('tr');
        if (allRows.length <= 1) {
          console.log('Cannot delete the only row in the table');
          return;
        }
        
        row.remove();
        console.log('Row deleted successfully');
        this.onInput();
        this.cdr.detectChanges(); // Force change detection
      } catch (error) {
        console.error('Error deleting row:', error);
      }
    });
  }

  // Delete column
  deleteColumn() {
    console.log('deleteColumn called, selectedCell:', this.selectedCell);
    if (!this.selectedCell) {
      console.log('No selectedCell, returning early');
      return;
    }
    
    this.ngZone.run(() => {
      try {
        // Store the selected cell before hiding tooltip
        const selectedCell = this.selectedCell;
        this.hideCellTooltip();
        
        const table = selectedCell?.closest('table');
        if (!table) {
          console.error('Could not find parent table');
          return;
        }
        
        const cellIndex = (selectedCell as HTMLTableCellElement).cellIndex;
        const allRows = table.querySelectorAll('tr');
        
        // Check if this is the only column in the table
        if (allRows.length > 0 && allRows[0].cells.length <= 1) {
          console.log('Cannot delete the only column in the table');
          return;
        }
        
        // Delete the cell from each row
        allRows.forEach(tr => {
          if (tr.cells[cellIndex]) {
            tr.deleteCell(cellIndex);
          }
        });
        
        console.log('Column deleted successfully');
        this.onInput();
        this.cdr.detectChanges(); // Force change detection
      } catch (error) {
        console.error('Error deleting column:', error);
      }
    });
  }

  onTableKeyDown(event: KeyboardEvent) {
    this.hideCellTooltip(); // hide tooltip while typing
  }

  // Update active states for toolbar buttons
  updateActiveStates() {
    const sel = window.getSelection();
    if (!sel || sel.rangeCount === 0) {
      return;
    }

    const container = sel.anchorNode;
    // make sure selection is inside your editor
    if (!container || !this.editorRef.nativeElement.contains(container as Node)) {
      return;
    }

    // toggle states
    this.activeStates.bold = document.queryCommandState('bold');
    this.activeStates.italic = document.queryCommandState('italic');
    this.activeStates.underline = document.queryCommandState('underline');
    this.activeStates.strikeThrough = document.queryCommandState('strikeThrough');
    this.activeStates.insertUnorderedList = document.queryCommandState('insertUnorderedList');
    this.activeStates.insertOrderedList = document.queryCommandState('insertOrderedList');
    this.activeStates.justifyLeft = document.queryCommandState('justifyLeft');
    this.activeStates.justifyCenter = document.queryCommandState('justifyCenter');
    this.activeStates.justifyRight = document.queryCommandState('justifyRight');
    this.activeStates.justifyFull = document.queryCommandState('justifyFull');

    // block format
    const block = document.queryCommandValue('formatBlock');
    if (block && block !== 'false') {
      this.activeStates.formatBlock = block;
    }

    // font name
    const fontName = document.queryCommandValue('fontName');
    if (fontName && fontName !== 'false') {
      // normalize quotes
      this.activeStates.fontName = fontName.replace(/['"]/g, '');
    }

    // font size
    const fontSize = document.queryCommandValue('fontSize');
    if (fontSize && fontSize !== 'false') {
      this.activeStates.fontSize = fontSize;
    }

    // foreColor
    const foreColor = document.queryCommandValue('foreColor');
    if (foreColor && foreColor !== 'false') {
      this.activeStates.foreColor = this.rgbToHex(foreColor);
    }
  }


  // Convert RGB color to hex
  private rgbToHex(rgb: string): string {
    // If it's already hex, return it
    if (rgb.startsWith('#')) return rgb;

    // Extract RGB values
    const result = /rgb\((\d+),\s*(\d+),\s*(\d+)\)/.exec(rgb);
    if (!result) return '#000000';

    const r = parseInt(result[1]);
    const g = parseInt(result[2]);
    const b = parseInt(result[3]);

    return "#" + ((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1);
  }

  @HostListener('document:selectionchange')
  onSelectionChange() {
    this.updateActiveStates();
  }

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent) {
    // Hide tooltip if clicking outside the editor or tooltip
    if (this.tooltipVisible && 
        !this.editorRef.nativeElement.contains(event.target as Node) &&
        !(event.target as HTMLElement).closest('.cell-tooltip')) {
      this.hideCellTooltip();
    }
  }
}