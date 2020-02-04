import { AfterViewInit, Directive, ElementRef, OnDestroy } from '@angular/core';
import { LoggerService } from '../../../../services';

@Directive({
  selector: '.dropdown'
})
export class DropdownDirective implements AfterViewInit, OnDestroy {
  dropdownEl: HTMLElement;
  triggerEl: HTMLElement;
  menuEl: HTMLElement;
  triggerElSelector = '.dropdown-trigger';
  menuElSelector = '.dropdown-menu';
  isActiveClass = 'is-active';
  isHoverableClass = 'is-hoverable';
  keepOnClickClass = 'keep-on-click';
  clickEventType = 'click';
  isActive = false;
  isMobileSafari = !!navigator.platform && /iPad|iPhone|iPod/.test(navigator.platform);

  constructor(private dropdownElRef: ElementRef, private logger: LoggerService) { }

  ngAfterViewInit(): void {
    if (!this.dropdownElRef || !this.dropdownElRef.nativeElement) {
      return;
    }

    this.dropdownEl = this.dropdownElRef.nativeElement;

    if (this.isMobileSafari) {
      // hover doesn't work on mobile safari :(
      this.dropdownEl.classList.remove(this.isHoverableClass);
    }

    this.triggerEl = this.dropdownEl.querySelector(this.triggerElSelector) as HTMLElement;

    if (!this.triggerEl) {
      return;
    }

    this.triggerEl.addEventListener(this.clickEventType, this.onTriggerClick.bind(this));

    if (!window) {
      return;
    }
    window.addEventListener(this.clickEventType, this.onWindowClick.bind(this));

    this.menuEl = this.dropdownEl.querySelector(this.menuElSelector) as HTMLElement;
  }

  ngOnDestroy(): void {
    if (!this.triggerEl) {
      return;
    }
    this.triggerEl.removeEventListener(this.clickEventType, this.onTriggerClick.bind(this));

    if (!window) {
      return;
    }
    window.removeEventListener(this.clickEventType, this.onWindowClick.bind(this));
  }

  onTriggerClick(event: MouseEvent): void {
    event.preventDefault();
    this.toggle();
  }

  onWindowClick(event: MouseEvent): void {
    if (this.isActive) {
      const isDropdownClicked = this.isChildOf(event.target as HTMLElement, this.dropdownEl);
      if (!isDropdownClicked) {
        this.toggle();
      }
    }
    const isMenuClicked = this.isChildOf(event.target as HTMLElement, this.menuEl);
    if (isMenuClicked && !this.dropdownEl.classList.contains(this.keepOnClickClass)) {
      this.hide();
    }
  }

  toggle(): void {
    this.dropdownEl.classList.toggle(this.isActiveClass);
    this.isActive = this.dropdownEl.classList.contains(this.isActiveClass);
  }

  open(): void {
    if (!this.dropdownEl.classList.contains(this.isActiveClass)) {
      this.dropdownEl.classList.add(this.isActiveClass);
    }
  }

  hide(): void {
    this.dropdownEl.classList.remove(this.isActiveClass);
    this.isActive = false;
    const prev = this.dropdownEl.style.display;
    this.dropdownEl.style.display = 'none';
    setTimeout(() => this.dropdownEl.style.display = prev);
  }

  private isChildOf(child: HTMLElement, parent: HTMLElement): boolean {
    if (child === parent) {
      return true;
    }
    const actualParent = child.parentElement;
    if (actualParent === parent) {
      return true;
    }
    if (!actualParent) {
      return false;
    }
    return this.isChildOf(actualParent, parent); // recursive search
  }
}
