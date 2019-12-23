import { AfterViewInit, Directive, ElementRef, OnDestroy } from '@angular/core';
import { LoggerService } from '../../../../services';

@Directive({
  selector: '.dropdown'
})
export class DropdownDirective implements AfterViewInit, OnDestroy {
  dropdownEl: HTMLElement;
  triggerEl: HTMLElement;
  isActiveClass = 'is-active';
  isHoverableClass = 'is-hoverable';
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

    this.triggerEl = this.dropdownEl.querySelector('.dropdown-trigger') as HTMLElement;

    if (!this.triggerEl) {
      return;
    }

    this.triggerEl.addEventListener(this.clickEventType, this.onTriggerClick.bind(this));

    if (!window) {
      return;
    }
    window.addEventListener(this.clickEventType, this.onWindowClick.bind(this));
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
    this.triggerIsActive();
  }

  onWindowClick(event: MouseEvent): void {
    if (!this.isActive) {
      return;
    }
    const isClosestToTrigger = this.isClosest(event.target as HTMLElement, this.dropdownEl);
    if (!isClosestToTrigger) {
      this.triggerIsActive();
    }
  }

  triggerIsActive(): void {
    this.dropdownEl.classList.toggle(this.isActiveClass);
    this.isActive = this.dropdownEl.classList.contains(this.isActiveClass);
  }

  open(): void {
    if (!this.dropdownEl.classList.contains(this.isActiveClass)) {
      this.dropdownEl.classList.add(this.isActiveClass);
    }
  }

  isClosest(element: HTMLElement, target: HTMLElement): boolean {
    if (element === target) {
      return true;
    }
    const actualParent = element.parentElement;
    if (actualParent === target) {
      return true;
    }
    if (!actualParent) {
      return false;
    }
    return this.isClosest(actualParent, target); // recursive search
  }
}
