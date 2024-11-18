import { EventData, Page, View } from '@nativescript/core';
import { MainViewModel } from './main-view-model';

export function navigatingTo(args: EventData) {
    const page = <Page>args.object;
    page.bindingContext = new MainViewModel();
}

export function onLoaded(args: EventData) {
    const container = <View>args.object;
    const page = container.page;
    const vm = page.bindingContext as MainViewModel;
    vm.initializeGame(container);
}

export function onUnloaded(args: EventData) {
    const page = (<View>args.object).page;
    const vm = page.bindingContext as MainViewModel;
    vm.onUnloaded();
}